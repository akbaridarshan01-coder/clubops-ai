import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  clubMember?: {
    role: string;
    clubId: string;
  };
}

export const authenticateJwt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuthJwt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch {
      // ignore invalid token in optional mode
    }
  }
  next();
};

export const requireClubRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clubId = (req.params.clubId || req.body.clubId || req.query.clubId) as string;
    if (!clubId) {
      return res.status(400).json({ error: 'Club ID must be specified for this operation.' });
    }

    const membership = await prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this club.' });
    }

    if (!allowedRoles.includes(membership.role) && membership.role !== 'OWNER') {
      return res.status(403).json({ error: `Insufficient permissions. Required: ${allowedRoles.join(', ')}` });
    }

    req.clubMember = membership;
    next();
  };
};
