import { prisma } from '../../db/prisma.js';

export class NotificationsService {
  async getUserNotifications(userId: string) {
    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });
    return { notifications: list, unreadCount };
  }

  async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}

export const notificationsService = new NotificationsService();
