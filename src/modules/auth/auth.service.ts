import crypto from 'crypto';
import prisma from '../../config/database';
import { HashUtil } from '../../utils/hash';
import { JWTUtil } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { Logger } from '../../utils/logger';
import { EmailService } from '../../utils/email';
import { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {

  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      Logger.security('Registration attempt with existing email', { email: data.email });
      throw new AppError(409, 'User already exists');
    }

    const hashedPassword = await HashUtil.hash(data.password);

    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, firstName: data.firstName, lastName: data.lastName },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    });

    const accessToken = JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = JWTUtil.generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    const hashedRefreshToken = await HashUtil.hash(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    // Send welcome email — non-blocking
    EmailService.sendWelcome(user.email, user.firstName);

    Logger.info('User registered successfully', { userId: user.id });

    return { user, accessToken, refreshToken };
  }

  static async login(data: LoginInput, ipAddress: string) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      Logger.security('Login attempt with non-existent email', { email: data.email, ip: ipAddress });
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await HashUtil.compare(data.password, user.password);

    if (!isPasswordValid) {
      Logger.security('Failed login attempt - invalid password', { userId: user.id, ip: ipAddress });
      throw new AppError(401, 'Invalid credentials');
    }

    const accessToken = JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = JWTUtil.generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    const hashedRefreshToken = await HashUtil.hash(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    Logger.info('User logged in successfully', { userId: user.id });

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    try {
      const payload = JWTUtil.verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });

      if (!user || !user.refreshToken) throw new AppError(401, 'Invalid refresh token');

      const isTokenValid = await HashUtil.compare(token, user.refreshToken);
      if (!isTokenValid) {
        Logger.security('Invalid refresh token attempt', { userId: user.id });
        throw new AppError(401, 'Invalid refresh token');
      }

      const accessToken = JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
      const newRefreshToken = JWTUtil.generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

      const hashedRefreshToken = await HashUtil.hash(newRefreshToken);
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefreshToken } });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
      Logger.security('Refresh token verification failed', { error: error.message });
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    Logger.info('User logged out', { userId });
  }

  // ── Forgot Password ────────────────────────────────────────
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — never reveal if email exists (security)
    if (!user) {
      Logger.security('Password reset for non-existent email', { email });
      return;
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await HashUtil.hash(resetToken);
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

    await EmailService.sendPasswordReset(user.email, user.firstName, resetToken);

    Logger.info('Password reset token generated', { userId: user.id });
  }

  // ── Reset Password ─────────────────────────────────────────
  static async resetPassword(token: string, newPassword: string) {
    // Find users with a non-expired reset token
    const users = await prisma.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { gt: new Date() },
      },
    });

    // Find the one whose hashed token matches
    let matchedUser = null;
    for (const user of users) {
      if (user.resetToken && await HashUtil.compare(token, user.resetToken)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await HashUtil.hash(newPassword);

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,       // clear token after use
        resetTokenExpiry: null,
        refreshToken: null,     // force re-login on all devices
      },
    });

    Logger.info('Password reset successful', { userId: matchedUser.id });
  }
}






// import prisma from '../../config/database';
// import { HashUtil } from '../../utils/hash';
// import { JWTUtil } from '../../utils/jwt';
// import { AppError } from '../../middleware/errorHandler';
// import { Logger } from '../../utils/logger';
// import { RegisterInput, LoginInput } from './auth.schema';

// export class AuthService {
//   static async register(data: RegisterInput) {
   
//     const existingUser = await prisma.user.findUnique({
//       where: { email: data.email },
//     });

//     if (existingUser) {
//       Logger.security('Registration attempt with existing email', { email: data.email,});
//       throw new AppError(409, 'User already exists');
//     }

 
//     const hashedPassword = await HashUtil.hash(data.password);

//     const user = await prisma.user.create({
//       data:   { email: data.email, password: hashedPassword, firstName: data.firstName, lastName: data.lastName, },
//       select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, },
//     });


//     // Generate tokens
//     const accessToken = JWTUtil.generateAccessToken({ userId: user.id, email: user.email, role: user.role,});
//     const refreshToken = JWTUtil.generateRefreshToken({ userId: user.id, email: user.email, role: user.role, });

//     // Store refresh token (hashed for security)
//     const hashedRefreshToken = await HashUtil.hash(refreshToken);
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { refreshToken: hashedRefreshToken },
//     });

//     Logger.info('User registered successfully', { userId: user.id });

//     return { user, accessToken, refreshToken, };
//   }





//   static async login(data: LoginInput, ipAddress: string) {
//     // Find user
//     const user = await prisma.user.findUnique({
//       where: { email: data.email },
//     });

//     if (!user) {
//       Logger.security('Login attempt with non-existent email', {
//         email: data.email,
//         ip: ipAddress,
//       });
//       // Generic message to prevent user enumeration
//       throw new AppError(401, 'Invalid credentials');
//     }

//     // Verify password
//     const isPasswordValid = await HashUtil.compare(data.password, user.password);

//     if (!isPasswordValid) {
//       Logger.security('Failed login attempt - invalid password', {
//         userId: user.id,
//         ip: ipAddress,
//       });
//       throw new AppError(401, 'Invalid credentials');
//     }

//     // Generate tokens
//     const accessToken = JWTUtil.generateAccessToken({
//       userId: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     const refreshToken = JWTUtil.generateRefreshToken({
//       userId: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     // Store refresh token
//     const hashedRefreshToken = await HashUtil.hash(refreshToken);
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { refreshToken: hashedRefreshToken },
//     });

//     Logger.info('User logged in successfully', { userId: user.id });

//     return {
//       user: {
//         id: user.id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName,
//       },
//       accessToken,
//       refreshToken,
//     };
//   }





//   static async refreshToken(token: string) {
//     try {
//       // Verify refresh token
//       const payload = JWTUtil.verifyRefreshToken(token);

//       // Find user
//       const user = await prisma.user.findUnique({
//         where: { id: payload.userId },
//       });

//       if (!user || !user.refreshToken) {
//         throw new AppError(401, 'Invalid refresh token');
//       }

//       // Verify stored refresh token
//       const isTokenValid = await HashUtil.compare(token, user.refreshToken);

//       if (!isTokenValid) {
//         Logger.security('Invalid refresh token attempt', {
//           userId: user.id,
//         });
//         throw new AppError(401, 'Invalid refresh token');
//       }

//       // Generate new tokens
//       const accessToken = JWTUtil.generateAccessToken({
//         userId: user.id,
//         email: user.email,
//         role: user.role,
//       });

//       const newRefreshToken = JWTUtil.generateRefreshToken({
//         userId: user.id,
//         email: user.email,
//         role: user.role,
//       });

//       // Update stored refresh token
//       const hashedRefreshToken = await HashUtil.hash(newRefreshToken);
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { refreshToken: hashedRefreshToken },
//       });

//       return {
//         accessToken,
//         refreshToken: newRefreshToken,
//       };
//     } catch (error: any) {
//       Logger.security('Refresh token verification failed', {
//         error: error.message,
//       });
//       throw new AppError(401, 'Invalid or expired refresh token');
//     }
//   }


//   static async logout(userId: string) {
//     await prisma.user.update({
//       where: { id: userId },
//       data: { refreshToken: null },
//     });

//     Logger.info('User logged out', { userId });
//   }
// }