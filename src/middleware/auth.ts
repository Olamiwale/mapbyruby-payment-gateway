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
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {

   
     // Accept token from Bearer header OR cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError(401, 'No token provided');
    }
    const payload = JWTUtil.verifyAccessToken(token);




    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
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


//admin only middleware
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    Logger.security('Unauthorized admin access attempt', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path,
    });
    return next(new AppError(403, 'Admin access required'));
  }
  next();
};