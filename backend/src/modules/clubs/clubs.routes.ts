import { Router } from 'express';
import { clubsController } from './clubs.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.post('/', clubsController.createClub as any);
router.get('/my', clubsController.getUserClubs as any);
router.post('/join', clubsController.joinClub as any);
router.get('/:id', clubsController.getClub as any);

export default router;
