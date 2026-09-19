import { prisma } from '../../db/prisma.js';

export class AnnouncementsService {
  async getAnnouncements(eventId: string) {
    return await prisma.announcement.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(data: {
    eventId: string;
    title: string;
    channel: string;
    content: string;
    targetAudience?: string;
  }) {
    return await prisma.announcement.create({
      data: {
        eventId: data.eventId,
        title: data.title,
        channel: data.channel,
        content: data.content,
        targetAudience: data.targetAudience || 'ALL',
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }
}

export const announcementsService = new AnnouncementsService();
