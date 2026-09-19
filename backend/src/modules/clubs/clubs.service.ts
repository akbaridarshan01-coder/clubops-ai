import { prisma } from '../../db/prisma.js';

export class ClubsService {
  async createClub(userId: string, data: {
    name: string;
    college: string;
    category: string;
    description?: string;
    logo?: string;
  }) {
    // Generate unique 6-char alphanumeric join code
    const joinCode = 'CLUB-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const club = await prisma.club.create({
      data: {
        name: data.name,
        college: data.college,
        category: data.category,
        description: data.description,
        logo: data.logo,
        joinCode,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        teams: {
          create: [
            { name: 'Core Leadership', color: '#6366F1', description: 'Overall steering and executive coordination' },
            { name: 'Technical & Platform', color: '#06B6D4', description: 'Hackathon portals, devops, stage audio/visuals' },
            { name: 'Logistics & Operations', color: '#F59E0B', description: 'Venue setup, equipment, schedules, crowd control' },
            { name: 'Sponsorship & Outreach', color: '#10B981', description: 'Partner relations, brand booths, VIP hospitality' },
            { name: 'Marketing & Media', color: '#EC4899', description: 'Campaigns, social content, video, campus posters' },
            { name: 'Hospitality & Registration', color: '#8B5CF6', description: 'Check-in desks, badges, catering, volunteer dispatch' },
          ],
        },
      },
      include: {
        teams: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        clubId: club.id,
        userId,
        action: 'CREATED_CLUB',
        entityType: 'CLUB',
        entityId: club.id,
        details: JSON.stringify({ name: club.name, college: club.college }),
      },
    });

    return club;
  }

  async getClub(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        teams: true,
        events: {
          orderBy: { date: 'desc' },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true, events: true, volunteers: true, documents: true },
        },
      },
    });

    if (!club) throw new Error('Club not found');
    return club;
  }

  async getUserClubs(userId: string) {
    const owned = await prisma.club.findMany({
      where: { ownerId: userId },
      include: {
        events: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: { select: { members: true, events: true } },
      },
    });

    const memberOf = await prisma.clubMember.findMany({
      where: { userId, role: { not: 'OWNER' } },
      include: {
        club: {
          include: {
            events: { take: 5, orderBy: { createdAt: 'desc' } },
            _count: { select: { members: true, events: true } },
          },
        },
      },
    });

    return [
      ...owned.map(c => ({ ...c, role: 'OWNER' })),
      ...memberOf.map(m => ({ ...m.club, role: m.role })),
    ];
  }

  async joinClubByCode(userId: string, joinCode: string) {
    const club = await prisma.club.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
    });

    if (!club) {
      throw new Error('Invalid club join code.');
    }

    const existing = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId,
        },
      },
    });

    if (existing) {
      return { club, message: 'You are already a member of this club.' };
    }

    await prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId,
        role: 'MEMBER',
      },
    });

    return { club, message: `Successfully joined ${club.name}!` };
  }
}

export const clubsService = new ClubsService();
