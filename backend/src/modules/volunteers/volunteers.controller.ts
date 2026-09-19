import { Request, Response } from 'express';
import { volunteersService } from './volunteers.service.js';

export class VolunteersController {
  async getVolunteers(req: Request, res: Response) {
    try {
      const clubId = req.query.clubId as string;
      if (!clubId) return res.status(400).json({ error: 'clubId is required' });

      const teamId = req.query.teamId as string | undefined;
      const volunteers = await volunteersService.getVolunteers(clubId, teamId);
      return res.json(volunteers);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createVolunteer(req: Request, res: Response) {
    try {
      const { clubId, name, email, phone, teamId, skills, experienceYears } = req.body;
      if (!clubId || !name || !email) {
        return res.status(400).json({ error: 'clubId, name, and email are required.' });
      }

      const volunteer = await volunteersService.createVolunteer(clubId, {
        name,
        email,
        phone,
        teamId,
        skills: skills || [],
        experienceYears: Number(experienceYears) || 1,
      });

      return res.status(201).json(volunteer);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async matchForTask(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId;
      const matches = await volunteersService.matchVolunteersForTask(taskId);
      return res.json(matches);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const volunteersController = new VolunteersController();
