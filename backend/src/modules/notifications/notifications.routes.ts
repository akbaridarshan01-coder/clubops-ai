import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/', notificationsController.getNotifications as any);
router.patch('/:id/read', notificationsController.markRead as any);
router.post('/mark-all-read', notificationsController.markAllRead as any);

export default router;
