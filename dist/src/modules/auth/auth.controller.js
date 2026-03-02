"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const jwt_1 = require("../../utils/jwt");
const database_1 = __importDefault(require("../../config/database"));
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: { user: result.user, accessToken: result.accessToken },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const result = await auth_service_1.AuthService.login(req.body, ipAddress);
            res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: { user: result.user, accessToken: result.accessToken },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.refreshToken(req.body.refreshToken);
            res.status(200).json({ success: true, message: 'Token refreshed successfully', data: result });
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            await auth_service_1.AuthService.logout(req.user.userId);
            res.clearCookie('refreshToken', { path: '/' });
            res.status(200).json({ success: true, message: 'Logout successful' });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const user = await database_1.default.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, email: true, firstName: true, lastName: true, isVerified: true, createdAt: true },
            });
            res.status(200).json({ success: true, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMe(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }
            const payload = jwt_1.JWTUtil.verifyRefreshToken(refreshToken);
            const user = await database_1.default.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
            });
            if (!user)
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            const accessToken = jwt_1.JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
            return res.status(200).json({ success: true, data: { user, accessToken } });
        }
        catch (error) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
    }
    // POST /auth/forgot-password
    static async forgotPassword(req, res, next) {
        try {
            await auth_service_1.AuthService.forgotPassword(req.body.email);
            // Always return success — never reveal if email exists
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a reset link has been sent.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /auth/reset-password
    static async resetPassword(req, res, next) {
        try {
            await auth_service_1.AuthService.resetPassword(req.body.token, req.body.password);
            res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
// import { Request, Response, NextFunction } from 'express';
// import { AuthService } from './auth.service';
// import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema';
// import { AuthRequest } from '../../middleware/auth';
// import { JWTUtil } from '../../utils/jwt';
// import prisma from '../../config/database';
// const COOKIE_OPTIONS = {
//   httpOnly: true,                                          // JS cannot read — XSS proof
//   secure: process.env.NODE_ENV === 'production',           // HTTPS only in production
//   sameSite: 'lax' as const,                               // CSRF protection
//   maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days (matches refresh token)
//   path: '/',
// };
// export class AuthController {
//   static async register(
//     req: Request<{}, {}, RegisterInput>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const result = await AuthService.register(req.body);
//       // Set refreshToken as httpOnly cookie
//       res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
//       res.status(201).json({
//         success: true,
//         message: 'User registered successfully',
//         data: {
//           user: result.user,
//           accessToken: result.accessToken,
//           // Never send refreshToken in body — it's in the cookie
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
//   static async login(
//     req: Request<{}, {}, LoginInput>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
//       const result = await AuthService.login(req.body, ipAddress);
//       // Set refreshToken as httpOnly cookie
//       res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
//       res.status(200).json({
//         success: true,
//         message: 'Login successful',
//         data: {
//           user: result.user,
//           accessToken: result.accessToken,
//           // Never send refreshToken in body — it's in the cookie
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
//   static async refreshToken(
//     req: Request<{}, {}, RefreshTokenInput>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const result = await AuthService.refreshToken(req.body.refreshToken);
//       res.status(200).json({
//         success: true,
//         message: 'Token refreshed successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
//   static async logout(
//     req: AuthRequest,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       await AuthService.logout(req.user!.userId);
//       // Clear the httpOnly cookie
//       res.clearCookie('refreshToken', { path: '/' });
//       res.status(200).json({
//         success: true,
//         message: 'Logout successful',
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
//   static async getProfile(
//     req: AuthRequest,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: req.user!.userId },
//         select: {
//           id: true,
//           email: true,
//           firstName: true,
//           lastName: true,
//           isVerified: true,
//           createdAt: true,
//         },
//       });
//       res.status(200).json({
//         success: true,
//         data: user,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
//   // Restores session on page load/refresh using httpOnly cookie
//   static async getMe(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const refreshToken = (req as any).cookies?.refreshToken;
//       if (!refreshToken) {
//         return res.status(401).json({
//           success: false,
//           message: 'Not authenticated',
//         });
//       }
//       // Verify the refresh token from cookie
//       const payload = JWTUtil.verifyRefreshToken(refreshToken);
//       const user = await prisma.user.findUnique({
//         where: { id: payload.userId },
//         select: {
//           id: true,
//           email: true,
//           firstName: true,
//           lastName: true,
//           role: true,
//           createdAt: true,
//         },
//       });
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: 'Not authenticated',
//         });
//       }
//       // Issue a fresh accessToken
//       const accessToken = JWTUtil.generateAccessToken({
//         userId: user.id,
//         email: user.email,
//         role: user.role,
//       });
//       return res.status(200).json({
//         success: true,
//         data: { user, accessToken },
//       });
//     } catch (error) {
//       // Token invalid or expired — not authenticated
//       return res.status(401).json({
//         success: false,
//         message: 'Not authenticated',
//       });
//     }
//   }
// }
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
//# sourceMappingURL=auth.controller.js.map