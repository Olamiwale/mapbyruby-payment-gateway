import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/database';

export class AuthController {
  static async register(
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const result = await AuthService.login(req.body, ipAddress);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(
    req: Request<{}, {}, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      await AuthService.logout(req.user!.userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}