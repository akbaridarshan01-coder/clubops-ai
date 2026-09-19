import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { authenticateJwt, optionalAuthJwt } from '../../middleware/auth.js';

const router = Router();

// Chatbot query is accessible with optional auth (personalizes if logged in, works general if not)
router.post('/copilot', optionalAuthJwt as any, aiController.copilot as any);

// Protected actions requiring full authentication
router.post('/action', authenticateJwt as any, aiController.executeAction as any);
router.post('/what-if', authenticateJwt as any, aiController.whatIf as any);
router.post('/announcement', authenticateJwt as any, aiController.announcement as any);
router.post('/brain', authenticateJwt as any, aiController.queryBrain as any);

export default router;
