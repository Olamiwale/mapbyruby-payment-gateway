import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
}

export class JWTUtil {
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
      issuer: 'e-commerce',
      audience: 'e-commerce-client',
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
      issuer: 'e-commerce',
      audience: 'e-commerce-client',
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'e-commerce',
      audience: 'e-commerce',
    }) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'e-commerce',
      audience: 'e-commerce',
    }) as TokenPayload;
  }
}