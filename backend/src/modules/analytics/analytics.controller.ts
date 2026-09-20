import { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId;
      const data = await analyticsService.getEventAnalytics(eventId);
      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getPostEventReport(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId;
      const report = await analyticsService.generatePostEventReport(eventId);
      return res.json(report);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
