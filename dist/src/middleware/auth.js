"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError(401, 'No token provided');
        }
        const token = authHeader.substring(7);
        const payload = jwt_1.JWTUtil.verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
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
//# sourceMappingURL=auth.js.map