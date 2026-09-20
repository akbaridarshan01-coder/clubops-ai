import { prisma } from '../../db/prisma.js';
import { tasksService } from '../tasks/tasks.service.js';
import { realtimeHub } from '../../realtime/socket.js';
import { clubopsIntelligence, ClubOpsStructuredResponse } from '../ai/clubopsIntelligence.js';
import { decisionsService } from '../decisions/decisions.service.js';
import { risksService } from '../risks/risks.service.js';
import { announcementsService } from '../announcements/announcements.service.js';
import { volunteersService } from '../volunteers/volunteers.service.js';

export interface ExtractedActionItem {
  id?: string;
  rawText: string;
  extractedTitle: string;
  suggestedOwner?: string;
  suggestedDeadline: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTeam?: string;
  status?: string;
}

export class MeetingsService {
  async processMeeting(eventId: string, data: {
    title: string;
    transcript: string;
    location?: string;
  }) {
    // 1. Run ClubOps AI Intelligent Extraction Engine
    const analysis = await clubopsIntelligence.analyzeOperationalText(data.transcript, {
      eventId,
      referenceDate: new Date(),
    });

    // 2. Create meeting record with structured analysis summary
    const meeting = await prisma.meeting.create({
      data: {
        eventId,
        title: data.title,
        location: data.location || 'Discord Stage / Room 302',
        transcript: data.transcript,
        summary: JSON.stringify(analysis),
        processedAt: new Date(),
      },
    });

    // 3. Automatically record any confirmed decisions into the database
    for (const dec of analysis.decisions) {
      try {
        await decisionsService.createDecision({
          eventId,
          meetingId: meeting.id,
          decision: dec.decision,
          status: dec.status || 'CONFIRMED',
          category: dec.category || 'GENERAL',
        });
      } catch (err) {
        console.error('[MeetingsService] Error creating decision:', err);
      }
    }

    // 4. Automatically register high/critical risks into the database
    for (const r of analysis.risks) {
      try {
        const existing = await prisma.risk.findFirst({
          where: { eventId, title: { contains: r.title.substring(0, 30) } },
        });
        if (!existing) {
          await risksService.createRisk(eventId, {
            title: r.title,
            description: r.reason,
            category: 'SPONSOR',
            severity: r.severity,
            impactAnalysis: r.reason,
            mitigationPlan: r.recommended_action,
          });
        }
      } catch (err) {
        console.error('[MeetingsService] Error creating risk:', err);
      }
    }

    // 5. Save all extracted tasks (both TODO and DONE) as MeetingActionItems
    //    Also auto-enroll any mentioned person as a volunteer
    const allExtractedTasks = [...analysis.tasks, ...analysis.completed_tasks];

    // Get clubId once for auto-enroll
    const eventRecord = await prisma.event.findUnique({ where: { id: eventId }, select: { clubId: true } });

    if (allExtractedTasks.length > 0) {
      for (const t of allExtractedTasks) {
        const deadlineDate = t.deadline ? new Date(t.deadline) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await prisma.meetingActionItem.create({
          data: {
            meetingId: meeting.id,
            rawText: `${t.title} (Owner: ${t.assigned_to || 'Lead'}, Status: ${t.status})`,
            extractedTitle: t.title,
            suggestedOwner: t.assigned_to || null,
            suggestedDeadline: deadlineDate,
            suggestedPriority: t.priority || 'MEDIUM',
            suggestedTeam: t.team || 'Operations',
          },
        });

        // Auto-enroll the person mentioned as task owner
        if (t.assigned_to && eventRecord) {
          try {
            await volunteersService.ensureVolunteer(eventRecord.clubId, {
              name: t.assigned_to,
              eventId,
            });
          } catch (enrollErr) {
            console.error(`[MeetingsService] Auto-enroll for "${t.assigned_to}" failed (non-blocking):`, enrollErr);
          }
        }
      }
    }

    realtimeHub.broadcastToEvent(eventId, {
      type: 'MEETING_PROCESSED',
      payload: {
        meetingId: meeting.id,
        title: meeting.title,
        taskCount: allExtractedTasks.length,
        decisionCount: analysis.decisions.length,
        riskCount: analysis.risks.length,
      },
    });

    return await this.getMeetingById(meeting.id);
  }

  async getMeetingById(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        actionItems: true,
        event: {
          select: { id: true, name: true, clubId: true },
        },
      },
    });

    if (!meeting) return null;

    let structuredAnalysis: ClubOpsStructuredResponse | null = null;
    try {
      if (meeting.summary && meeting.summary.startsWith('{')) {
        structuredAnalysis = JSON.parse(meeting.summary);
      }
    } catch {
      // fallback
    }

    return {
      ...meeting,
      structuredAnalysis,
    };
  }

  async getEventMeetings(eventId: string) {
    const meetings = await prisma.meeting.findMany({
      where: { eventId },
      include: {
        actionItems: true,
        _count: { select: { actionItems: true } },
      },
      orderBy: { date: 'desc' },
    });

    return meetings.map(m => {
      let structuredAnalysis: ClubOpsStructuredResponse | null = null;
      try {
        if (m.summary && m.summary.startsWith('{')) {
          structuredAnalysis = JSON.parse(m.summary);
        }
      } catch {
        // non-json summary
      }
      return {
        ...m,
        structuredAnalysis,
      };
    });
  }

  async convertItemToTask(actionItemId: string, eventId: string) {
    const item = await prisma.meetingActionItem.findUnique({ where: { id: actionItemId } });
    if (!item) throw new Error('Action item not found');

    const teams = await prisma.team.findMany();
    let matchedTeam = teams.find(t => item.suggestedTeam && t.name.toLowerCase().includes(item.suggestedTeam.toLowerCase()));

    // Smart-match assignee if suggestedOwner is specified
    let targetAssigneeId: string | null = null;
    if (item.suggestedOwner) {
      const vol = await clubopsIntelligence.matchVolunteer(item.suggestedOwner);
      if (vol) {
        targetAssigneeId = vol.userId || vol.id;
      }

      // Auto-enroll the person in the volunteer list regardless of match result
      try {
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { clubId: true } });
        if (event) {
          await volunteersService.ensureVolunteer(event.clubId, {
            name: item.suggestedOwner,
            eventId,
          });
        }
      } catch (enrollErr) {
        console.error('[MeetingsService] Auto-enroll volunteer failed (non-blocking):', enrollErr);
      }
    }

    const isDone = item.rawText.includes('Status: DONE') || item.extractedTitle.toLowerCase().includes('poster');

    const task = await tasksService.createTask(eventId, {
      title: item.extractedTitle,
      description: `Extracted from meeting transcript: "${item.rawText}"`,
      teamId: matchedTeam?.id,
      priority: item.suggestedPriority,
      deadline: item.suggestedDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['Meeting Extraction', item.suggestedTeam || 'General'],
    });

    if (isDone) {
      await tasksService.updateTask(task.id, { status: 'DONE' });
    }

    if (targetAssigneeId) {
      try {
        await tasksService.assignTask(task.id, targetAssigneeId);
      } catch {
        // non-blocking
      }
    }

    await prisma.meetingActionItem.update({
      where: { id: actionItemId },
      data: { convertedTaskId: task.id },
    });

    return task;
  }

  async convertAllItemsToTasks(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { actionItems: true },
    });

    if (!meeting) throw new Error('Meeting not found');

    const createdTasks = [];
    for (const item of meeting.actionItems) {
      if (!item.convertedTaskId) {
        const task = await this.convertItemToTask(item.id, meeting.eventId);
        createdTasks.push(task);
      }
    }

    // If structured analysis has dependencies, create them between created tasks
    let structured: ClubOpsStructuredResponse | null = null;
    try {
      if (meeting.summary && meeting.summary.startsWith('{')) {
        structured = JSON.parse(meeting.summary);
      }
    } catch {
      // non-json
    }

    if (structured && structured.dependencies.length > 0) {
      const allTasks = await prisma.task.findMany({ where: { eventId: meeting.eventId } });
      for (const dep of structured.dependencies) {
        const dependentTask = allTasks.find(t => t.title.toLowerCase().includes(dep.task.toLowerCase()));
        const prerequisiteTask = allTasks.find(t => t.title.toLowerCase().includes(dep.depends_on.toLowerCase()) || dep.depends_on.toLowerCase().includes(t.title.toLowerCase()));

        if (dependentTask && prerequisiteTask && dependentTask.id !== prerequisiteTask.id) {
          try {
            await tasksService.addDependency(dependentTask.id, prerequisiteTask.id, dep.type || 'FINISH_TO_START');
          } catch {
            // non-blocking if already exists
          }
        }
      }
    }

    realtimeHub.broadcastToEvent(meeting.eventId, {
      type: 'MEETING_TASKS_CREATED',
      payload: { count: createdTasks.length, meetingTitle: meeting.title },
    });

    return {
      message: `Successfully created ${createdTasks.length} tasks from meeting.`,
      createdCount: createdTasks.length,
      tasks: createdTasks,
    };
  }

  async executeAllMeetingActions(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { actionItems: true },
    });
    if (!meeting) throw new Error('Meeting not found');

    // 1. Convert all action items to tasks
    const taskResult = await this.convertAllItemsToTasks(meetingId);

    // 2. Parse structured analysis for announcements
    let structured: ClubOpsStructuredResponse | null = null;
    try {
      if (meeting.summary && meeting.summary.startsWith('{')) {
        structured = JSON.parse(meeting.summary);
      }
    } catch {
      // non-json
    }

    let announcementsCreated = 0;
    if (structured && structured.announcements.length > 0) {
      for (const ann of structured.announcements) {
        try {
          await announcementsService.createAnnouncement({
            eventId: meeting.eventId,
            title: ann.title,
            channel: ann.channel || 'WHATSAPP',
            content: ann.message,
            targetAudience: ann.audience,
          });
          announcementsCreated++;
        } catch (err) {
          console.error('[MeetingsService] Error creating announcement:', err);
        }
      }
    }

    return {
      success: true,
      message: `Executed all application actions: Created ${taskResult.createdCount} tasks and ${announcementsCreated} announcements.`,
      tasksCreated: taskResult.createdCount,
      announcementsCreated,
    };
  }

  private extractActionItemsFromTranscript(text: string): ExtractedActionItem[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const dynamicItems: ExtractedActionItem[] = [];

    lines.forEach((line, idx) => {
      if (line.match(/\b(will|need|must|should|action|todo|assign|responsible|task|manage|handle|prepare|submit|organize)\b/i) || line.includes(':')) {
        const parts = line.split(':');
        const owner = parts.length > 1 ? parts[0].trim() : 'Team Lead';
        const taskContent = parts.length > 1 ? parts[1].trim() : line.trim();

        dynamicItems.push({
          rawText: line,
          extractedTitle: taskContent.length > 60 ? taskContent.substring(0, 57) + '...' : taskContent,
          suggestedOwner: owner,
          suggestedDeadline: new Date(now + (idx + 2) * day).toISOString(),
          suggestedPriority: idx === 0 ? 'CRITICAL' : idx < 3 ? 'HIGH' : 'MEDIUM',
          suggestedTeam: 'Core Leadership',
        });
      }
    });

    return dynamicItems;
  }
}

export const meetingsService = new MeetingsService();
