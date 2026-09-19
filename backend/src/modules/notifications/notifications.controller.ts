import { Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class NotificationsController {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const data = await notificationsService.getUserNotifications(req.user.id);
      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async markRead(req: AuthRequest, res: Response) {
    try {
      const updated = await notificationsService.markAsRead(req.params.id);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async markAllRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const result = await notificationsService.markAllAsRead(req.user.id);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const notificationsController = new NotificationsController();
