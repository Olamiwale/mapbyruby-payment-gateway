import prisma from '../../config/database';
import { HashUtil } from '../../utils/hash';
import { JWTUtil } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { Logger } from '../../utils/logger';
import { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {
  static async register(data: RegisterInput) {
   
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      Logger.security('Registration attempt with existing email', {
        email: data.email,
      });
      throw new AppError(409, 'User already exists');
    }

 
    const hashedPassword = await HashUtil.hash(data.password);

  
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = JWTUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token (hashed for security)
    const hashedRefreshToken = await HashUtil.hash(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    Logger.info('User registered successfully', { userId: user.id });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginInput, ipAddress: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      Logger.security('Login attempt with non-existent email', {
        email: data.email,
        ip: ipAddress,
      });
      // Generic message to prevent user enumeration
      throw new AppError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await HashUtil.compare(data.password, user.password);

    if (!isPasswordValid) {
      Logger.security('Failed login attempt - invalid password', {
        userId: user.id,
        ip: ipAddress,
      });
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = JWTUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const hashedRefreshToken = await HashUtil.hash(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    Logger.info('User logged in successfully', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    try {
      // Verify refresh token
      const payload = JWTUtil.verifyRefreshToken(token);

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.refreshToken) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Verify stored refresh token
      const isTokenValid = await HashUtil.compare(token, user.refreshToken);

      if (!isTokenValid) {
        Logger.security('Invalid refresh token attempt', {
          userId: user.id,
        });
        throw new AppError(401, 'Invalid refresh token');
      }

      // Generate new tokens
      const accessToken = JWTUtil.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const newRefreshToken = JWTUtil.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Update stored refresh token
      const hashedRefreshToken = await HashUtil.hash(newRefreshToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      Logger.security('Refresh token verification failed', {
        error: error.message,
      });
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    Logger.info('User logged out', { userId });
  }
}