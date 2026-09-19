import { prisma } from '../../db/prisma.js';

export class EventsService {
  async createEvent(data: {
    clubId: string;
    name: string;
    type: string;
    date: string | Date;
    endDate?: string | Date;
    expectedParticipants?: number;
    location: string;
    budget?: number;
    description?: string;
  }) {
    const event = await prisma.event.create({
      data: {
        clubId: data.clubId,
        name: data.name,
        type: data.type,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        expectedParticipants: data.expectedParticipants || 500,
        location: data.location,
        budget: data.budget || 0,
        description: data.description,
        status: 'PLANNING',
        healthScore: 92,
        currentMilestone: 'Initial Setup & Scoping',
      },
    });

    // Generate initial workstreams and tasks based on event type
    await this.scaffoldEventWorkspace(event.id, data.clubId, data.type, new Date(data.date));

    return await this.getEventById(event.id);
  }

  async getEventById(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: {
          include: {
            teams: true,
          },
        },
        tasks: {
          include: {
            team: true,
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            dependencies: { include: { dependsOn: true } },
          },
          orderBy: { deadline: 'asc' },
        },
        risks: {
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        },
        meetings: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { tasks: true, risks: true, meetings: true, documents: true },
        },
      },
    });

    if (!event) throw new Error('Event not found');

    const health = await this.calculateHealthScore(eventId);
    return { ...event, healthScore: health.score, healthBreakdown: health.breakdown };
  }

  async getClubEvents(clubId: string) {
    return await prisma.event.findMany({
      where: { clubId },
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { tasks: true, risks: true, meetings: true },
        },
      },
    });
  }

  async updateEvent(eventId: string, data: Partial<{
    name: string;
    status: string;
    location: string;
    budget: number;
    healthScore: number;
    currentMilestone: string;
    description: string;
  }>) {
    return await prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  async calculateHealthScore(eventId: string): Promise<{ score: number; breakdown: any }> {
    const tasks = await prisma.task.findMany({ where: { eventId } });
    const risks = await prisma.risk.findMany({ where: { eventId, status: { not: 'RESOLVED' } } });

    if (tasks.length === 0) {
      return {
        score: 85,
        breakdown: { taskPenalty: 0, riskPenalty: 15, blockerPenalty: 0 },
      };
    }

    const now = new Date();
    const overdueTasks = tasks.filter(t => t.status !== 'DONE' && new Date(t.deadline) < now);
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
    const unassignedTasks = tasks.filter(t => !t.assigneeId && (t.priority === 'HIGH' || t.priority === 'CRITICAL'));

    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');
    const highRisks = risks.filter(r => r.severity === 'HIGH');

    // Penalties calculation
    let score = 100;
    const taskPenalty = Math.min(30, overdueTasks.length * 6);
    const blockerPenalty = Math.min(25, blockedTasks.length * 8);
    const riskPenalty = Math.min(30, criticalRisks.length * 10 + highRisks.length * 5);
    const unassignedPenalty = Math.min(15, unassignedTasks.length * 4);

    score = Math.max(15, score - taskPenalty - blockerPenalty - riskPenalty - unassignedPenalty);

    // Save updated score
    await prisma.event.update({
      where: { id: eventId },
      data: { healthScore: score },
    });

    return {
      score,
      breakdown: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        overdueCount: overdueTasks.length,
        blockedCount: blockedTasks.length,
        criticalRisksCount: criticalRisks.length,
        highRisksCount: highRisks.length,
        unassignedCritical: unassignedTasks.length,
      },
    };
  }

  private async scaffoldEventWorkspace(eventId: string, clubId: string, eventType: string, eventDate: Date) {
    const teams = await prisma.team.findMany({ where: { clubId } });
    const teamMap = new Map(teams.map(t => [t.name, t.id]));

    const logisticsId = teamMap.get('Logistics & Operations');
    const techId = teamMap.get('Technical & Platform');
    const marketingId = teamMap.get('Marketing & Media');
    const sponsorId = teamMap.get('Sponsorship & Outreach');
    const hospId = teamMap.get('Hospitality & Registration');

    const dayMs = 24 * 60 * 60 * 1000;
    const eventTime = eventDate.getTime();

    // 1. Initial Tasks
    const t1 = await prisma.task.create({
      data: {
        eventId,
        teamId: logisticsId,
        title: 'Auditorium & Lab Venue Booking Confirmation',
        description: 'Secure formal university approval and safety clearance for main auditorium.',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        deadline: new Date(eventTime - 20 * dayMs),
        estimatedHours: 6,
        riskLevel: 'HIGH',
        tags: JSON.stringify(['Venue', 'Permits', 'Milestone 1']),
      },
    });

    const t2 = await prisma.task.create({
      data: {
        eventId,
        teamId: logisticsId,
        title: 'Main Stage Audio-Visual & Power Grid Setup',
        description: 'Stage lighting, dual projectors, redundant microphone rigs, and 3-phase power.',
        status: 'TODO',
        priority: 'HIGH',
        deadline: new Date(eventTime - 5 * dayMs),
        estimatedHours: 8,
        riskLevel: 'MEDIUM',
        tags: JSON.stringify(['AV', 'Stage']),
      },
    });

    const t3 = await prisma.task.create({
      data: {
        eventId,
        teamId: techId,
        title: 'Hackathon Registration Portal & QR Check-in System',
        description: 'Deploy real-time scanner app and team formation API.',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        deadline: new Date(eventTime - 12 * dayMs),
        estimatedHours: 16,
        riskLevel: 'LOW',
        tags: JSON.stringify(['Software', 'Portal']),
      },
    });

    const t4 = await prisma.task.create({
      data: {
        eventId,
        teamId: sponsorId,
        title: 'Title Sponsor Agreement & Cash Grant Disbursement',
        description: 'Finalize contracts with tech sponsors and confirm swag delivery dates.',
        status: 'DONE',
        priority: 'HIGH',
        deadline: new Date(eventTime - 25 * dayMs),
        estimatedHours: 10,
        riskLevel: 'LOW',
        tags: JSON.stringify(['Sponsors', 'Finance']),
      },
    });

    const t5 = await prisma.task.create({
      data: {
        eventId,
        teamId: hospId,
        title: 'Participant Food & Energy Drink Catering Contract',
        description: 'Arrange dinner, midnight snacks, and coffee station for 48 hours.',
        status: 'TODO',
        priority: 'MEDIUM',
        deadline: new Date(eventTime - 7 * dayMs),
        estimatedHours: 5,
        riskLevel: 'MEDIUM',
        tags: JSON.stringify(['Catering', 'Hospitality']),
      },
    });

    // 2. Link Dependencies (Stage Setup depends on Venue Confirmation)
    await prisma.taskDependency.create({
      data: {
        taskId: t2.id,
        dependsOnTaskId: t1.id,
        type: 'FINISH_TO_START',
      },
    });

    // 3. Initial Risks
    await prisma.risk.create({
      data: {
        eventId,
        title: 'University Admin Approval Delay for Auditorium',
        description: 'Admin Dean board meeting rescheduled, which could delay stage load-in by 3 days.',
        category: 'VENUE',
        severity: 'HIGH',
        status: 'IDENTIFIED',
        impactAnalysis: 'Cascades to Stage Setup, Decoration, and Technical Soundcheck.',
        mitigationPlan: 'Prepare Open-Air Amphitheater as fallback venue; contact Student Dean for fast-track signature.',
        affectedTasks: JSON.stringify([t1.id, t2.id]),
      },
    });

    await prisma.risk.create({
      data: {
        eventId,
        title: 'High-Density Wi-Fi Capacity Bottleneck',
        description: 'Simultaneous load from 500+ participants might exceed campus subnet DHCP pool.',
        category: 'TECHNICAL',
        severity: 'MEDIUM',
        status: 'MITIGATING',
        impactAnalysis: 'Hacker connectivity degradation during opening ceremony.',
        mitigationPlan: 'Provision 2 dedicated 5G wireless routers from network vendor.',
        affectedTasks: JSON.stringify([t3.id]),
      },
    });
  }
}

export const eventsService = new EventsService();
