import { Request, Response } from 'express';
import { risksService } from './risks.service.js';

export class RisksController {
  async getRisks(req: Request, res: Response) {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) return res.status(400).json({ error: 'eventId is required' });

      const severity = req.query.severity as string | undefined;
      const risks = await risksService.getRisks(eventId, severity);
      return res.json(risks);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createRisk(req: Request, res: Response) {
    try {
      const { eventId, title, description, category, severity, impactAnalysis, mitigationPlan, affectedTasks } = req.body;
      if (!eventId || !title || !description || !category) {
        return res.status(400).json({ error: 'eventId, title, description, and category are required' });
      }

      const risk = await risksService.createRisk(eventId, {
        title,
        description,
        category,
        severity,
        impactAnalysis,
        mitigationPlan,
        affectedTasks,
      });

      return res.status(201).json(risk);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, mitigationNotes } = req.body;
      const updated = await risksService.updateRiskStatus(req.params.id, status, mitigationNotes);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async runAnalysis(req: Request, res: Response) {
    try {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: 'eventId is required' });

      const result = await risksService.runRiskRadarAnalysis(eventId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const risksController = new RisksController();
