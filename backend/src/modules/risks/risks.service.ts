import { prisma } from '../../db/prisma.js';
import { realtimeHub } from '../../realtime/socket.js';
import { eventsService } from '../events/events.service.js';

export class RisksService {
  async getRisks(eventId: string, severity?: string) {
    const where: any = { eventId };
    if (severity) where.severity = severity;

    return await prisma.risk.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createRisk(eventId: string, data: {
    title: string;
    description: string;
    category: string;
    severity: string;
    impactAnalysis?: string;
    mitigationPlan?: string;
    affectedTasks?: string[];
  }) {
    const risk = await prisma.risk.create({
      data: {
        eventId,
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity || 'MEDIUM',
        impactAnalysis: data.impactAnalysis,
        mitigationPlan: data.mitigationPlan,
        affectedTasks: data.affectedTasks ? JSON.stringify(data.affectedTasks) : null,
        status: 'IDENTIFIED',
      },
    });

    realtimeHub.broadcastRiskAlert(eventId, risk);
    const health = await eventsService.calculateHealthScore(eventId);
    realtimeHub.broadcastHealthUpdate(eventId, health.score);

    return risk;
  }

  async updateRiskStatus(riskId: string, status: string, mitigationNotes?: string) {
    const risk = await prisma.risk.findUnique({ where: { id: riskId } });
    if (!risk) throw new Error('Risk not found');

    const updated = await prisma.risk.update({
      where: { id: riskId },
      data: {
        status,
        mitigationPlan: mitigationNotes ? `${risk.mitigationPlan || ''}\n${mitigationNotes}`.trim() : risk.mitigationPlan,
      },
    });

    const health = await eventsService.calculateHealthScore(risk.eventId);
    realtimeHub.broadcastHealthUpdate(risk.eventId, health.score);

    return updated;
  }

  async runRiskRadarAnalysis(eventId: string) {
    const tasks = await prisma.task.findMany({
      where: { eventId },
      include: {
        dependencies: { include: { dependsOn: true } },
        dependedOnBy: true,
        assignee: true,
      },
    });

    const now = new Date();
    const newRisksFound = [];

    // 1. Check for unassigned critical tasks
    const unassignedCritical = tasks.filter(t => !t.assigneeId && (t.priority === 'CRITICAL' || t.priority === 'HIGH'));
    for (const t of unassignedCritical) {
      const existing = await prisma.risk.findFirst({
        where: { eventId, title: { contains: t.title } },
      });
      if (!existing) {
        const risk = await this.createRisk(eventId, {
          title: `Unassigned Critical Task: ${t.title}`,
          description: `Task has priority '${t.priority}' with deadline ${new Date(t.deadline).toLocaleDateString()}, but no team lead or volunteer has been assigned.`,
          category: 'TIMELINE',
          severity: 'HIGH',
          impactAnalysis: 'Failure to start this task promptly threatens downstream event milestones.',
          mitigationPlan: 'Use Smart Volunteer Matching to assign a lead immediately.',
          affectedTasks: [t.id],
        });
        newRisksFound.push(risk);
      }
    }

    // 2. Check for dependency bottlenecks
    for (const t of tasks) {
      if (t.status === 'BLOCKED' || (t.status !== 'DONE' && new Date(t.deadline) < now)) {
        if (t.dependedOnBy.length > 0) {
          const dependentIds = t.dependedOnBy.map(d => d.taskId);
          const existing = await prisma.risk.findFirst({
            where: { eventId, title: { contains: `Bottleneck: ${t.title}` } },
          });

          if (!existing) {
            const risk = await this.createRisk(eventId, {
              title: `Bottleneck: ${t.title} blocks ${dependentIds.length} tasks`,
              description: `Overdue/blocked prerequisite is holding up ${dependentIds.length} dependent tasks in the critical path.`,
              category: 'TIMELINE',
              severity: 'CRITICAL',
              impactAnalysis: `Directly delays ${t.dependedOnBy.length} tasks and could push the launch date.`,
              mitigationPlan: 'Reallocate additional volunteers or execute emergency fast-track procedure.',
              affectedTasks: [t.id, ...dependentIds],
            });
            newRisksFound.push(risk);
          }
        }
      }
    }

    return {
      status: 'complete',
      totalDetected: newRisksFound.length,
      risks: newRisksFound,
    };
  }
}

export const risksService = new RisksService();
