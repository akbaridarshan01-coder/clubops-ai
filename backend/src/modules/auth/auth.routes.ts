import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/send-email-otp', authController.requestLoginOtp);
router.post('/send-mobile-otp', authController.requestLoginOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.get('/me', authenticateJwt as any, authController.getMe as any);

export default router;
