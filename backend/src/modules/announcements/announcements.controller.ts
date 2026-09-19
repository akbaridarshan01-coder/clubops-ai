import { Request, Response } from 'express';
import { announcementsService } from './announcements.service.js';

export class AnnouncementsController {
  async getAnnouncements(req: Request, res: Response) {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) return res.status(400).json({ error: 'eventId is required' });

      const list = await announcementsService.getAnnouncements(eventId);
      return res.json(list);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createAnnouncement(req: Request, res: Response) {
    try {
      const { eventId, title, channel, content, targetAudience } = req.body;
      if (!eventId || !title || !channel || !content) {
        return res.status(400).json({ error: 'eventId, title, channel, and content are required' });
      }

      const item = await announcementsService.createAnnouncement({
        eventId,
        title,
        channel,
        content,
        targetAudience,
      });

      return res.status(201).json(item);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const announcementsController = new AnnouncementsController();
