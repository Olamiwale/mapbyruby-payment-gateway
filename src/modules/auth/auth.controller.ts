import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema';
import { AuthRequest } from '../../middleware/auth';
import { JWTUtil } from '../../utils/jwt';
import prisma from '../../config/database';

const COOKIE_OPTIONS = {
  httpOnly: true,                                          // JS cannot read — XSS proof
  secure: process.env.NODE_ENV === 'production',           // HTTPS only in production
  sameSite: 'lax' as const,                               // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days (matches refresh token)
  path: '/',
};

export class AuthController {

  static async register(
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await AuthService.register(req.body);

      // Set refreshToken as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          // Never send refreshToken in body — it's in the cookie
        },
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

      // Set refreshToken as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          // Never send refreshToken in body — it's in the cookie
        },
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

      // Clear the httpOnly cookie
      res.clearCookie('refreshToken', { path: '/' });

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

  // Restores session on page load/refresh using httpOnly cookie
  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const refreshToken = (req as any).cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      // Verify the refresh token from cookie
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      // Issue a fresh accessToken
      const accessToken = JWTUtil.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      return res.status(200).json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      // Token invalid or expired — not authenticated
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }
  }
}









/*import { Request, Response, NextFunction } from 'express';
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
}*/