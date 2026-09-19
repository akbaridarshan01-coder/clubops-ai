import { Response } from 'express';
import { clubsService } from './clubs.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ClubsController {
  async createClub(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { name, college, category, description, logo } = req.body;
      if (!name || !college || !category) {
        return res.status(400).json({ error: 'Name, College, and Category are required.' });
      }

      const club = await clubsService.createClub(req.user.id, {
        name,
        college,
        category,
        description,
        logo,
      });

      return res.status(201).json(club);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getClub(req: AuthRequest, res: Response) {
    try {
      const clubId = req.params.id;
      const club = await clubsService.getClub(clubId);
      return res.json(club);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async getUserClubs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const clubs = await clubsService.getUserClubs(req.user.id);
      return res.json(clubs);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async joinClub(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { joinCode } = req.body;
      if (!joinCode) return res.status(400).json({ error: 'Join code is required.' });

      const result = await clubsService.joinClubByCode(req.user.id, joinCode);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const clubsController = new ClubsController();
