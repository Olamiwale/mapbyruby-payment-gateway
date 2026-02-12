"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const hash_1 = require("../../utils/hash");
const jwt_1 = require("../../utils/jwt");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
class AuthService {
    static async register(data) {
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            logger_1.Logger.security('Registration attempt with existing email', {
                email: data.email,
            });
            throw new errorHandler_1.AppError(409, 'User already exists');
        }
        const hashedPassword = await hash_1.HashUtil.hash(data.password);
        const user = await database_1.default.user.create({
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
        const accessToken = jwt_1.JWTUtil.generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = jwt_1.JWTUtil.generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token (hashed for security)
        const hashedRefreshToken = await hash_1.HashUtil.hash(refreshToken);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        logger_1.Logger.info('User registered successfully', { userId: user.id });
        return {
            user,
            accessToken,
            refreshToken,
        };
    }
    static async login(data, ipAddress) {
        // Find user
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            logger_1.Logger.security('Login attempt with non-existent email', {
                email: data.email,
                ip: ipAddress,
            });
            // Generic message to prevent user enumeration
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await hash_1.HashUtil.compare(data.password, user.password);
        if (!isPasswordValid) {
            logger_1.Logger.security('Failed login attempt - invalid password', {
                userId: user.id,
                ip: ipAddress,
            });
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Generate tokens
        const accessToken = jwt_1.JWTUtil.generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = jwt_1.JWTUtil.generateRefreshToken({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token
        const hashedRefreshToken = await hash_1.HashUtil.hash(refreshToken);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });
        logger_1.Logger.info('User logged in successfully', { userId: user.id });
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
    static async refreshToken(token) {
        try {
            // Verify refresh token
            const payload = jwt_1.JWTUtil.verifyRefreshToken(token);
            // Find user
            const user = await database_1.default.user.findUnique({
                where: { id: payload.userId },
            });
            if (!user || !user.refreshToken) {
                throw new errorHandler_1.AppError(401, 'Invalid refresh token');
            }
            // Verify stored refresh token
            const isTokenValid = await hash_1.HashUtil.compare(token, user.refreshToken);
            if (!isTokenValid) {
                logger_1.Logger.security('Invalid refresh token attempt', {
                    userId: user.id,
                });
                throw new errorHandler_1.AppError(401, 'Invalid refresh token');
            }
            // Generate new tokens
            const accessToken = jwt_1.JWTUtil.generateAccessToken({
                userId: user.id,
                email: user.email,
            });
            const newRefreshToken = jwt_1.JWTUtil.generateRefreshToken({
                userId: user.id,
                email: user.email,
            });
            // Update stored refresh token
            const hashedRefreshToken = await hash_1.HashUtil.hash(newRefreshToken);
            await database_1.default.user.update({
                where: { id: user.id },
                data: { refreshToken: hashedRefreshToken },
            });
            return {
                accessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            logger_1.Logger.security('Refresh token verification failed', {
                error: error.message,
            });
            throw new errorHandler_1.AppError(401, 'Invalid or expired refresh token');
        }
    }
    static async logout(userId) {
        await database_1.default.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        logger_1.Logger.info('User logged out', { userId });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map