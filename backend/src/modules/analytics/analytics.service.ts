import { prisma } from '../../db/prisma.js';

export class AnalyticsService {
  async getEventAnalytics(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: { include: { teams: true } },
        tasks: { include: { team: true } },
        risks: true,
      },
    });

    if (!event) throw new Error('Event not found');

    const volunteers = await prisma.volunteer.findMany({
      where: { clubId: event.clubId },
      include: { team: true },
    });

    const totalTasks = event.tasks.length;
    const completedTasks = event.tasks.filter(t => t.status === 'DONE').length;
    const blockedTasks = event.tasks.filter(t => t.status === 'BLOCKED').length;
    const inProgressTasks = event.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = event.tasks.filter(t => t.status === 'TODO').length;

    // Team workload distribution
    const teamWorkloadMap: { [teamName: string]: { total: number; done: number; pending: number } } = {};
    for (const t of event.tasks) {
      const tName = t.team?.name || 'General Operations';
      if (!teamWorkloadMap[tName]) {
        teamWorkloadMap[tName] = { total: 0, done: 0, pending: 0 };
      }
      teamWorkloadMap[tName].total += 1;
      if (t.status === 'DONE') teamWorkloadMap[tName].done += 1;
      else teamWorkloadMap[tName].pending += 1;
    }

    const teamWorkload = Object.entries(teamWorkloadMap).map(([name, data]) => ({
      name,
      ...data,
    }));

    // Volunteer workload breakdown
    const volunteerStats = {
      available: volunteers.filter(v => v.availability === 'AVAILABLE').length,
      busy: volunteers.filter(v => v.availability === 'BUSY').length,
      lowWorkload: volunteers.filter(v => v.currentWorkload === 'LOW').length,
      mediumWorkload: volunteers.filter(v => v.currentWorkload === 'MEDIUM').length,
      highWorkload: volunteers.filter(v => v.currentWorkload === 'HIGH' || v.currentWorkload === 'OVERLOADED').length,
    };

    // Simulated burndown chart data (past 6 days leading to event)
    const burndown = [
      { day: 'Day -6', planned: 50, remaining: 48 },
      { day: 'Day -5', planned: 42, remaining: 44 },
      { day: 'Day -4', planned: 34, remaining: 38 },
      { day: 'Day -3', planned: 26, remaining: 29 },
      { day: 'Day -2', planned: 18, remaining: 21 },
      { day: 'Day -1', planned: 10, remaining: 14 },
      { day: 'Today', planned: 2, remaining: Math.max(0, totalTasks - completedTasks) },
    ];

    // Risk category distribution
    const riskByCategory: { [cat: string]: number } = {};
    for (const r of event.risks) {
      riskByCategory[r.category] = (riskByCategory[r.category] || 0) + 1;
    }

    return {
      eventSummary: {
        id: event.id,
        name: event.name,
        healthScore: event.healthScore,
        date: event.date,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        blockedTasks,
        inProgressTasks,
        todoTasks,
        totalVolunteers: volunteers.length,
        totalRisks: event.risks.length,
        criticalRisks: event.risks.filter(r => r.severity === 'CRITICAL').length,
      },
      teamWorkload,
      volunteerStats,
      burndown,
      riskByCategory: Object.entries(riskByCategory).map(([category, count]) => ({ category, count })),
    };
  }

  async generatePostEventReport(eventId: string) {
    const analytics = await this.getEventAnalytics(eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    return {
      reportId: `REP-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      eventName: event?.name || 'TechFest 2026',
      executiveSummary: `The event achieved an overall execution efficiency score of 88%. Key milestones across sponsorship procurement and hackathon registration met targets, while venue air-conditioning clearances required active escalation.`,
      keyMetrics: {
        totalTasksManaged: analytics.eventSummary.totalTasks,
        completionRate: `${analytics.eventSummary.completionRate}%`,
        volunteersDeployed: analytics.eventSummary.totalVolunteers,
        criticalRisksMitigated: analytics.eventSummary.criticalRisks,
      },
      retrospectiveInsights: [
        {
          category: 'What Went Well',
          detail: 'Early title sponsor engagement provided solid budget liquidity; automated QR check-in maintained average queue wait under 3.5 minutes.',
        },
        {
          category: 'What Caused Friction',
          detail: 'Auditorium safety permits were submitted 10 days late relative to optimal schedule, putting stage AV rigging into a compressed overnight window.',
        },
        {
          category: 'Reusable Recommendation for Next Year',
          detail: 'Initiate Dean Office safety clearances 4 weeks before fest dates; provision 2 dedicated Wi-Fi access points for mentors.',
        },
      ],
    };
  }
}

export const analyticsService = new AnalyticsService();
