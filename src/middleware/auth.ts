import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt';
import { AppError } from './errorHandler';
import { Logger } from '../utils/logger';

export interface AuthRequest <
Params = any,
ResBody = any,
ReqBody = any,
ReqQuery = any,> extends Request <Params, ReqBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const payload = JWTUtil.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    Logger.security('Authentication failed', {
      ip: req.ip,
      path: req.path,
      error: error.message,
    });

    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token expired'));
    }

    next(error);
  }
};