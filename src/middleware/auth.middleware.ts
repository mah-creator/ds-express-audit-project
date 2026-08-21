import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Errors } from 'ds-express-errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here_for_development_only';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Forward the raw JsonWebTokenError/TokenExpiredError to next() so
        // ds-express-errors' jwtMapper handles it, instead of responding here.
        return next(err);
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } else {
    return next(Errors.Unauthorized('Missing Authorization header'));
  }
};

// Role-based authorization middleware
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(Errors.Forbidden('Insufficient role'));
    }
    next();
  };
};
