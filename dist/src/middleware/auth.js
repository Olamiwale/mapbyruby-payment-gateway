"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        // Accept token from Bearer header OR cookie
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw new errorHandler_1.AppError(401, 'No token provided');
        }
        const payload = jwt_1.JWTUtil.verifyAccessToken(token);
        // const authHeader = req.headers.authorization;
        // if (!authHeader || !authHeader.startsWith('Bearer ')) {
        //   throw new AppError(401, 'No token provided');
        // }
        // const token = authHeader.substring(7);
        // const payload = JWTUtil.verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        logger_1.Logger.security('Authentication failed', {
            ip: req.ip,
            path: req.path,
            error: error.message,
        });
        if (error.name === 'JsonWebTokenError') {
            return next(new errorHandler_1.AppError(401, 'Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new errorHandler_1.AppError(401, 'Token expired'));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
//admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        logger_1.Logger.security('Unauthorized admin access attempt', {
            ip: req.ip,
            userId: req.user?.userId,
            path: req.path,
        });
        return next(new errorHandler_1.AppError(403, 'Admin access required'));
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=auth.js.map