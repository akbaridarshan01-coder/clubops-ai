import { Router } from 'express';
import { volunteersController } from './volunteers.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/', volunteersController.getVolunteers as any);
router.post('/', volunteersController.createVolunteer as any);
router.get('/match/:taskId', volunteersController.matchForTask as any);

export default router;
