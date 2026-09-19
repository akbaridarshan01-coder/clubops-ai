import { prisma } from '../../db/prisma.js';

export class VolunteersService {
  async getVolunteers(clubId: string, teamId?: string) {
    const where: any = { clubId };
    if (teamId) where.teamId = teamId;

    return await prisma.volunteer.findMany({
      where,
      include: {
        team: true,
        skillRecords: true,
      },
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
    });
  }

  async createVolunteer(clubId: string, data: {
    name: string;
    email: string;
    phone?: string;
    teamId?: string;
    skills: string[];
    experienceYears?: number;
  }) {
    const volunteer = await prisma.volunteer.create({
      data: {
        clubId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        teamId: data.teamId || null,
        skills: JSON.stringify(data.skills),
        experienceYears: data.experienceYears || 1.0,
        rating: 4.5 + Math.random() * 0.5,
        availability: 'AVAILABLE',
        currentWorkload: 'LOW',
        assignedHours: 0,
        skillRecords: {
          create: data.skills.map(s => ({
            skillName: s,
            proficiency: 4,
          })),
        },
      },
      include: {
        team: true,
        skillRecords: true,
      },
    });

    return volunteer;
  }

  async updateWorkload(volunteerId: string, assignedHours: number) {
    let currentWorkload = 'LOW';
    if (assignedHours > 16) currentWorkload = 'OVERLOADED';
    else if (assignedHours > 10) currentWorkload = 'HIGH';
    else if (assignedHours > 5) currentWorkload = 'MEDIUM';

    return await prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        assignedHours,
        currentWorkload,
      },
    });
  }

  async matchVolunteersForTask(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { event: true, team: true },
    });

    if (!task) throw new Error('Task not found');

    const volunteers = await prisma.volunteer.findMany({
      where: { clubId: task.event.clubId },
      include: { team: true, skillRecords: true },
    });

    const taskText = `${task.title} ${task.description || ''} ${task.tags || ''}`.toLowerCase();

    const matches = volunteers.map(vol => {
      let score = 50;
      let volSkills: string[] = [];
      if (vol.skills) {
        try {
          const parsed = JSON.parse(vol.skills);
          volSkills = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
          volSkills = vol.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      let matchedSkills: string[] = [];

      // 1. Skill keyword matches
      volSkills.forEach(s => {
        if (taskText.includes(s.toLowerCase())) {
          score += 25;
          matchedSkills.push(s);
        }
      });

      // 2. Team match
      if (task.teamId && vol.teamId === task.teamId) {
        score += 15;
      }

      // 3. Workload multiplier
      let workloadFactor = 1.0;
      if (vol.currentWorkload === 'LOW') workloadFactor = 1.0;
      else if (vol.currentWorkload === 'MEDIUM') workloadFactor = 0.85;
      else if (vol.currentWorkload === 'HIGH') workloadFactor = 0.6;
      else if (vol.currentWorkload === 'OVERLOADED') workloadFactor = 0.25;

      // 4. Availability penalty
      if (vol.availability !== 'AVAILABLE') {
        workloadFactor *= 0.4;
      }

      const finalPercentage = Math.min(98, Math.round(score * workloadFactor));

      let explanation = '';
      if (matchedSkills.length > 0) {
        explanation = `Matches required skills (${matchedSkills.join(', ')}). Workload is ${vol.currentWorkload}.`;
      } else if (task.teamId && vol.teamId === task.teamId) {
        explanation = `Member of the assigned team (${vol.team?.name || 'Assigned Team'}) with ${vol.currentWorkload} workload.`;
      } else {
        explanation = `Available general volunteer with ${vol.experienceYears}y experience.`;
      }

      return {
        volunteer: {
          id: vol.id,
          name: vol.name,
          email: vol.email,
          skills: volSkills,
          availability: vol.availability,
          workload: vol.currentWorkload,
          rating: vol.rating,
          team: vol.team?.name || 'General',
        },
        matchPercentage: finalPercentage,
        matchedSkills,
        workload: vol.currentWorkload,
        explanation,
      };
    });

    // Sort descending by match score
    return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 5);
  }
}

export const volunteersService = new VolunteersService();
