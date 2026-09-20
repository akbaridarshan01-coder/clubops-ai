import { Router } from 'express';
import { risksController } from './risks.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/', risksController.getRisks as any);
router.post('/', risksController.createRisk as any);
router.patch('/:id/status', risksController.updateStatus as any);
router.post('/analyze', risksController.runAnalysis as any);

export default router;
