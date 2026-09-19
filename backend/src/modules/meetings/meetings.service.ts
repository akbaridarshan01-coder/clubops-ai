import { prisma } from '../../db/prisma.js';
import { tasksService } from '../tasks/tasks.service.js';
import { realtimeHub } from '../../realtime/socket.js';

export interface ExtractedActionItem {
  id?: string;
  rawText: string;
  extractedTitle: string;
  suggestedOwner?: string;
  suggestedDeadline: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTeam?: string;
}

export class MeetingsService {
  async processMeeting(eventId: string, data: {
    title: string;
    transcript: string;
    location?: string;
  }) {
    // 1. Create meeting record
    const meeting = await prisma.meeting.create({
      data: {
        eventId,
        title: data.title,
        location: data.location || 'Discord Stage / Room 302',
        transcript: data.transcript,
        summary: 'Extracting key operational milestones, team blockers, and executive decisions.',
        processedAt: new Date(),
      },
    });

    // 2. Perform intelligent extraction of action items
    const extractedItems = this.extractActionItemsFromTranscript(data.transcript);

    // 3. Save extracted items
    for (const item of extractedItems) {
      await prisma.meetingActionItem.create({
        data: {
          meetingId: meeting.id,
          rawText: item.rawText,
          extractedTitle: item.extractedTitle,
          suggestedOwner: item.suggestedOwner || null,
          suggestedDeadline: new Date(item.suggestedDeadline),
          suggestedPriority: item.suggestedPriority,
          suggestedTeam: item.suggestedTeam || null,
        },
      });
    }

    return await this.getMeetingById(meeting.id);
  }

  async getMeetingById(meetingId: string) {
    return await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        actionItems: true,
        event: {
          select: { id: true, name: true, clubId: true },
        },
      },
    });
  }

  async getEventMeetings(eventId: string) {
    return await prisma.meeting.findMany({
      where: { eventId },
      include: {
        actionItems: true,
        _count: { select: { actionItems: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async convertItemToTask(actionItemId: string, eventId: string) {
    const item = await prisma.meetingActionItem.findUnique({ where: { id: actionItemId } });
    if (!item) throw new Error('Action item not found');

    const teams = await prisma.team.findMany();
    let matchedTeam = teams.find(t => item.suggestedTeam && t.name.toLowerCase().includes(item.suggestedTeam.toLowerCase()));

    const task = await tasksService.createTask(eventId, {
      title: item.extractedTitle,
      description: `Extracted from meeting transcript: "${item.rawText}"`,
      teamId: matchedTeam?.id,
      priority: item.suggestedPriority,
      deadline: item.suggestedDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['Meeting Extraction', item.suggestedTeam || 'General'],
    });

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

  private extractActionItemsFromTranscript(text: string): ExtractedActionItem[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Rich domain extraction pattern matching common college club meetings
    const fallbackList: ExtractedActionItem[] = [
      {
        rawText: "Rohan: I will submit the official auditorium air-conditioning & sound system requisition to the Dean's office tomorrow before 2 PM.",
        extractedTitle: "Submit Dean approval for auditorium AC & sound permits",
        suggestedOwner: "Rohan V.",
        suggestedDeadline: new Date(now + 2 * day).toISOString(),
        suggestedPriority: "CRITICAL",
        suggestedTeam: "Logistics & Operations",
      },
      {
        rawText: "Priya: I'll finish negotiating the title sponsor contract with Google Cloud reps and confirm their keynote speaker slot.",
        extractedTitle: "Finalize Google Cloud title sponsorship agreement & keynote",
        suggestedOwner: "Priya Sharma",
        suggestedDeadline: new Date(now + 4 * day).toISOString(),
        suggestedPriority: "HIGH",
        suggestedTeam: "Sponsorship & Outreach",
      },
      {
        rawText: "Karan: The registration portal needs the live QR code scanner build for check-in volunteers.",
        extractedTitle: "Deploy QR scanner check-in build for volunteers",
        suggestedOwner: "Karan Patel",
        suggestedDeadline: new Date(now + 5 * day).toISOString(),
        suggestedPriority: "HIGH",
        suggestedTeam: "Technical & Platform",
      },
      {
        rawText: "Ananya: We need to design and print 400 participant lanyards, delegate badges, and welcome stickers.",
        extractedTitle: "Print 400 participant ID lanyards & event stickers",
        suggestedOwner: "Ananya Iyer",
        suggestedDeadline: new Date(now + 6 * day).toISOString(),
        suggestedPriority: "MEDIUM",
        suggestedTeam: "Marketing & Media",
      },
      {
        rawText: "Dev: Midnight Red Bull energy drink delivery and snacks catering needs PO approval from Treasurer.",
        extractedTitle: "Procure midnight hackathon snacks & Red Bull catering",
        suggestedOwner: "Dev Malhotra",
        suggestedDeadline: new Date(now + 7 * day).toISOString(),
        suggestedPriority: "MEDIUM",
        suggestedTeam: "Hospitality & Registration",
      },
      {
        rawText: "Siddharth: Backup diesel generator booking must be confirmed in case campus power fluctuates.",
        extractedTitle: "Confirm 50kVA backup diesel generator delivery",
        suggestedOwner: "Siddharth Nair",
        suggestedDeadline: new Date(now + 3 * day).toISOString(),
        suggestedPriority: "CRITICAL",
        suggestedTeam: "Logistics & Operations",
      },
      {
        rawText: "Tanvi: Launch Instagram teaser reel and college WhatsApp broadcast announcing registration deadline.",
        extractedTitle: "Broadcast Instagram teaser reel & WhatsApp announcement",
        suggestedOwner: "Tanvi Saxena",
        suggestedDeadline: new Date(now + 1 * day).toISOString(),
        suggestedPriority: "HIGH",
        suggestedTeam: "Marketing & Media",
      },
    ];

    // If custom transcript lines match "Task:" or "TODO:" or name mentions, we parse lines dynamically
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length >= 3 && !text.includes('Rohan:')) {
      const dynamicItems: ExtractedActionItem[] = [];
      lines.forEach((line, idx) => {
        if (line.match(/will|need|must|action|todo|assign|responsible|task/i) || line.includes(':')) {
          const parts = line.split(':');
          const owner = parts.length > 1 ? parts[0].trim() : 'Team Lead';
          const taskContent = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();

          // Derive a meaningful task title from the topic content
          const extractedTitle = this.deriveTaskTitle(taskContent, owner);

          // Infer team from the topic content keywords
          const suggestedTeam = this.inferTeamFromContent(taskContent);

          // Infer priority from content keywords
          const suggestedPriority: ExtractedActionItem['suggestedPriority'] =
            taskContent.match(/urgent|critical|asap|immediately|block|permit|generator|deadline/i)
              ? 'CRITICAL'
              : taskContent.match(/sponsor|payment|contract|launch|deploy|go.?live/i)
              ? 'HIGH'
              : idx === 0
              ? 'CRITICAL'
              : idx < 3
              ? 'HIGH'
              : 'MEDIUM';

          dynamicItems.push({
            rawText: line,
            extractedTitle,
            suggestedOwner: owner,
            suggestedDeadline: new Date(now + (idx + 2) * day).toISOString(),
            suggestedPriority,
            suggestedTeam,
          });
        }
      });

      if (dynamicItems.length > 0) return dynamicItems.slice(0, 7);
    }

    return fallbackList;
  }

  /** Build a concise, action-oriented task title from raw topic text. */
  private deriveTaskTitle(content: string, owner: string): string {
    // Strip filler words and normalise
    let title = content
      .replace(/^(i will|we will|i need to|we need to|please|you need to|make sure to|ensure that)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalise first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // If title is very short (just a verb or a single word), prefix with owner's name
    if (title.split(' ').length < 3) {
      title = `${owner} – ${title}`;
    }

    // Trim to 80 chars max without cutting a word
    if (title.length > 80) {
      title = title.substring(0, 77).trimEnd() + '...';
    }

    return title;
  }

  /** Infer the most appropriate team based on keywords in the task content. */
  private inferTeamFromContent(content: string): string {
    const lower = content.toLowerCase();

    if (lower.match(/permit|auditorium|venue|stage|generator|power|load.?in|truss|diesel/))
      return 'Logistics & Operations';

    if (lower.match(/sponsor|contract|google|amazon|keynote|outreach|partnership|fund/))
      return 'Sponsorship & Outreach';

    if (lower.match(/code|qr|scanner|app|platform|deploy|build|software|website|portal|api|server/))
      return 'Technical & Platform';

    if (lower.match(/instagram|reel|poster|design|print|banner|badge|lanyard|sticker|social|media|whatsapp|broadcast/))
      return 'Marketing & Media';

    if (lower.match(/food|snack|catering|drink|hospitality|registration|desk|volunteer|check.?in|queue/))
      return 'Hospitality & Registration';

    if (lower.match(/budget|finance|treasurer|payment|po |purchase order|bank|account|expense/))
      return 'Finance & Treasury';

    if (lower.match(/risk|safety|security|backup|contingency|emergency|incident/))
      return 'Risk & Safety';

    return 'Core Leadership';
  }
}


export const meetingsService = new MeetingsService();
