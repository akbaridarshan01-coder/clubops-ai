import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { otpService } from './otp.service.js';

export class AuthService {
  private generateTokens(user: { id: string; email: string; role: string }) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, type: 'refresh' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  async register(data: {
    name: string;
    email: string;
    mobile?: string;
    password?: string;
    verifyMethod: 'EMAIL' | 'MOBILE';
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.mobile ? [{ mobile: data.mobile }] : []),
        ],
      },
    });

    if (existing) {
      const isUnverifiedForMethod = data.verifyMethod === 'MOBILE' ? !existing.verifiedMobile : !existing.verifiedEmail;
      if (isUnverifiedForMethod) {
        const targetId = data.verifyMethod === 'MOBILE' && data.mobile ? data.mobile : data.email;
        const oType = data.verifyMethod === 'MOBILE' ? 'MOBILE_VERIFY' : 'EMAIL_VERIFY';
        const otpRes = await otpService.generateAndSendOtp(targetId, oType as any);
        return {
          userId: existing.id,
          email: existing.email,
          mobile: existing.mobile,
          verifyMethod: data.verifyMethod,
          otpResult: otpRes,
        };
      }
      throw new Error('An account with this email or mobile number already exists.');
    }


    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
        passwordHash,
        role: 'ORGANIZER',
        verifiedEmail: false,
        verifiedMobile: false,
      },
    });

    const targetIdentifier = data.verifyMethod === 'MOBILE' && data.mobile ? data.mobile : data.email;
    const otpType = data.verifyMethod === 'MOBILE' ? 'MOBILE_VERIFY' : 'EMAIL_VERIFY';

    const otpResult = await otpService.generateAndSendOtp(targetIdentifier, otpType);

    return {
      userId: user.id,
      email: user.email,
      mobile: user.mobile,
      verifyMethod: data.verifyMethod,
      otpResult,
    };
  }

  async verifyOtpAndLogin(data: {
    identifier: string;
    code: string;
    type: 'EMAIL_VERIFY' | 'MOBILE_VERIFY' | 'LOGIN';
  }) {
    const verification = await otpService.verifyOtp(data.identifier, data.code, data.type);
    if (!verification.valid) {
      throw new Error(verification.message);
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.identifier },
          { mobile: data.identifier },
        ],
      },
      include: {
        clubsOwned: true,
        clubMemberships: {
          include: { club: true },
        },
      },
    });

    if (!user) {
      throw new Error('User account not found.');
    }

    // Update verified flags if registering
    if (data.type === 'EMAIL_VERIFY') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { verifiedEmail: true },
        include: { clubsOwned: true, clubMemberships: { include: { club: true } } },
      });
    } else if (data.type === 'MOBILE_VERIFY') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { verifiedMobile: true },
        include: { clubsOwned: true, clubMemberships: { include: { club: true } } },
      });
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        verifiedEmail: user.verifiedEmail,
        verifiedMobile: user.verifiedMobile,
        clubs: [
          ...user.clubsOwned.map(c => ({ id: c.id, name: c.name, role: 'OWNER' })),
          ...user.clubMemberships.map(m => ({ id: m.club.id, name: m.club.name, role: m.role })),
        ],
      },
      ...tokens,
    };
  }

  async loginWithPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clubsOwned: true,
        clubMemberships: { include: { club: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        clubs: [
          ...user.clubsOwned.map(c => ({ id: c.id, name: c.name, role: 'OWNER' })),
          ...user.clubMemberships.map(m => ({ id: m.club.id, name: m.club.name, role: m.role })),
        ],
      },
      ...tokens,
    };
  }

  async sendLoginOtp(identifier: string) {
    return await otpService.generateAndSendOtp(identifier, 'LOGIN');
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clubsOwned: true,
        clubMemberships: {
          include: { club: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      verifiedEmail: user.verifiedEmail,
      verifiedMobile: user.verifiedMobile,
      clubs: [
        ...user.clubsOwned.map(c => ({ id: c.id, name: c.name, role: 'OWNER', category: c.category })),
        ...user.clubMemberships.map(m => ({ id: m.club.id, name: m.club.name, role: m.role, category: m.club.category })),
      ],
    };
  }
}

export const authService = new AuthService();
