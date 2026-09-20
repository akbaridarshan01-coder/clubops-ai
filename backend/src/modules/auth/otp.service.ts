import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';

export interface IEmailOtpProvider {
  sendEmailOtp(email: string, code: string): Promise<boolean>;
  isConfigured(): boolean;
}

export interface ISmsOtpProvider {
  sendMobileOtp(mobile: string, code: string): Promise<boolean>;
  isConfigured(): boolean;
}

export class SmtpEmailProvider implements IEmailOtpProvider {
  isConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  async sendEmailOtp(email: string, code: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('OTP service is not configured. Please configure the required provider credentials.');
    }

    const isGmail = env.SMTP_HOST.toLowerCase().includes('gmail') || env.SMTP_USER.toLowerCase().includes('gmail.com');
    const transporter = isGmail
      ? nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })
      : nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });



    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #6366f1; margin: 0 0 6px 0; letter-spacing: -0.5px;">CLUBOPS AI</h1>
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">Event Operating System for College Clubs</p>
        </div>
        
        <div style="background: #131b2e; border: 1px solid #28354f; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #cbd5e1; margin-top: 0; margin-bottom: 16px;">Use the verification code below to complete your registration:</p>
          <div style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #818cf8; background: #0b0f19; border: 1px solid #374151; padding: 14px 20px; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; margin-bottom: 0;">This code will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>

        <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
          Secured by ClubOps AI Event Infrastructure &bull; Do not share this code with anyone.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `Your ClubOps AI Verification Code: ${code}`,
      text: `Your ClubOps AI verification code is: ${code}. This code is valid for 5 minutes.`,
      html: htmlContent,
    });

    return true;
  }
}

export class Fast2SmsProvider implements ISmsOtpProvider {
  isConfigured(): boolean {
    return Boolean(env.FAST2SMS_API_KEY);
  }

  async sendMobileOtp(mobile: string, code: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('OTP service is not configured. Please configure the required provider credentials.');
    }

    // Clean number to 10 digits for Indian mobile numbers
    const cleanNumber = mobile.replace(/[^\d]/g, '').slice(-10);
    if (cleanNumber.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variables_values: code,
        route: 'otp',
        numbers: cleanNumber,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || data.return === false) {
      const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || res.statusText);
      throw new Error(`Failed to deliver SMS via Fast2SMS: ${msg}`);
    }

    return true;
  }
}

export class OtpService {
  private emailProvider: IEmailOtpProvider;
  private smsProvider: ISmsOtpProvider;

  constructor(emailProvider?: IEmailOtpProvider, smsProvider?: ISmsOtpProvider) {
    this.emailProvider = emailProvider || new SmtpEmailProvider();
    this.smsProvider = smsProvider || new Fast2SmsProvider();
  }


  async generateAndSendOtp(
    identifier: string,
    type: 'EMAIL_VERIFY' | 'MOBILE_VERIFY' | 'LOGIN'
  ): Promise<{ success: boolean; cooldownExpiresAt: number; message: string }> {
    const isMobile = type === 'MOBILE_VERIFY' || (type === 'LOGIN' && identifier.startsWith('+'));

    // 1. Strict provider credential check before proceeding
    if (isMobile) {
      if (!this.smsProvider.isConfigured()) {
        throw new Error('OTP service is not configured. Please configure the required provider credentials.');
      }
    } else {
      if (!this.emailProvider.isConfigured()) {
        throw new Error('OTP service is not configured. Please configure the required provider credentials.');
      }
    }

    // 2. Cooldown check: cannot request a new OTP if previous request was < 60s ago
    const lastRequest = await prisma.otpVerification.findFirst({
      where: { identifier, type },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    if (lastRequest && now - new Date(lastRequest.createdAt).getTime() < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - new Date(lastRequest.createdAt).getTime())) / 1000);
      return {
        success: false,
        cooldownExpiresAt: new Date(lastRequest.createdAt).getTime() + 60000,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`,
      };
    }

    // 3. Generate cryptographically secure random 6-digit OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes expiry

    // 4. Save hash to database
    await prisma.otpVerification.create({
      data: {
        identifier,
        hashedCode,
        type,
        expiresAt,
        attempts: 0,
      },
    });

    // 5. Dispatch via real provider
    if (isMobile) {
      await this.smsProvider.sendMobileOtp(identifier, code);
    } else {
      await this.emailProvider.sendEmailOtp(identifier, code);
    }

    // 6. Return response strictly WITHOUT exposing the OTP code
    return {
      success: true,
      cooldownExpiresAt: now + 60000,
      message: isMobile 
        ? 'Verification code has been sent to your mobile number.' 
        : 'Verification code has been sent to your email address.',
    };
  }

  async verifyOtp(
    identifier: string,
    code: string,
    type: 'EMAIL_VERIFY' | 'MOBILE_VERIFY' | 'LOGIN'
  ): Promise<{ valid: boolean; message: string }> {
    const record = await prisma.otpVerification.findFirst({
      where: { identifier, type, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { valid: false, message: 'No active verification code found. Please request a new one.' };
    }

    if (new Date() > new Date(record.expiresAt)) {
      return { valid: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (record.attempts >= 5) {
      return { valid: false, message: 'Maximum attempts exceeded. Please request a new code.' };
    }

    // Secure bcrypt comparison
    const isMatch = await bcrypt.compare(code, record.hashedCode);
    if (!isMatch) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      const remaining = 4 - record.attempts;
      return {
        valid: false,
        message: remaining > 0 
          ? `Incorrect code. ${remaining} attempts remaining.` 
          : 'Maximum attempts exceeded. Please request a new code.',
      };
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    return { valid: true, message: 'Verification successful.' };
  }
}

export const otpService = new OtpService();
