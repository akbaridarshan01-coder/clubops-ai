import dotenv from 'dotenv';
import path from 'path';

// Resolve .env from the project root (where 'npx tsx src/server.ts' is run)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'clubops-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Email Provider (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'ClubOps AI <no-reply@clubops.org>',

  // Mobile SMS Provider (Fast2SMS)
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
};


