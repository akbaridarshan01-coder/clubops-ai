import { Router } from 'express';
import { decisionsController } from './decisions.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/', decisionsController.getDecisions as any);
router.post('/', decisionsController.createDecision as any);
router.patch('/:id', decisionsController.updateDecision as any);
router.delete('/:id', decisionsController.deleteDecision as any);

export default router;
