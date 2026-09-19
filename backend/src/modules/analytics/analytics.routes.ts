import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/:eventId', analyticsController.getAnalytics as any);
router.get('/:eventId/report', analyticsController.getPostEventReport as any);

export default router;
