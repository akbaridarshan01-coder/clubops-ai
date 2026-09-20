import { Request, Response } from 'express';
import { decisionsService } from './decisions.service.js';

export class DecisionsController {
  async getDecisions(req: Request, res: Response) {
    try {
      const eventId = (req.query.eventId as string) || '';
      if (!eventId) {
        return res.status(400).json({ error: 'eventId query parameter is required' });
      }
      const decisions = await decisionsService.getEventDecisions(eventId);
      return res.json(decisions);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async createDecision(req: Request, res: Response) {
    try {
      const { eventId, decision, status, category, rationale, meetingId } = req.body;
      if (!eventId || !decision) {
        return res.status(400).json({ error: 'eventId and decision are required' });
      }
      const created = await decisionsService.createDecision({
        eventId,
        decision,
        status,
        category,
        rationale,
        meetingId,
      });
      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateDecision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await decisionsService.updateDecision(id, req.body);
      if (!updated) return res.status(404).json({ error: 'Decision not found' });
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async deleteDecision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ok = await decisionsService.deleteDecision(id);
      if (!ok) return res.status(404).json({ error: 'Decision not found' });
      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const decisionsController = new DecisionsController();
