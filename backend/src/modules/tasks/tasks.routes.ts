import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJwt as any);

router.get('/', tasksController.getTasks as any);
router.post('/', tasksController.createTask as any);
router.patch('/:id', tasksController.updateTask as any);
router.delete('/:id', tasksController.deleteTask as any);
router.post('/:id/assign', tasksController.assignTask as any);
router.post('/:id/dependency', tasksController.addDependency as any);
router.delete('/:id/dependency/:dependsOnTaskId', tasksController.removeDependency as any);

export default router;
