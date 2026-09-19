import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { otpService } from './otp.service.js';
import { AuthRequest } from '../../middleware/auth.js';


export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, mobile, password, verifyMethod } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
      }

      const result = await authService.register({
        name,
        email,
        mobile,
        password,
        verifyMethod: verifyMethod || 'EMAIL',
      });

      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { identifier, code, type } = req.body;
      if (!identifier || !code) {
        return res.status(400).json({ error: 'Identifier and OTP code are required.' });
      }

      const result = await authService.verifyOtpAndLogin({
        identifier,
        code,
        type: type || 'EMAIL_VERIFY',
      });

      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Verification failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const result = await authService.loginWithPassword(email, password);
      return res.json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Login failed' });
    }
  }

  async requestLoginOtp(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;
      if (!identifier) {
        return res.status(400).json({ error: 'Email or mobile number is required.' });
      }

      const otpType = type || (identifier.startsWith('+') ? 'MOBILE_VERIFY' : 'EMAIL_VERIFY');
      const result = await otpService.generateAndSendOtp(identifier, otpType);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to send OTP' });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await authService.getProfile(req.user.id);
      return res.json(profile);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to fetch profile' });
    }
  }
}

export const authController = new AuthController();
