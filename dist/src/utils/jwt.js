"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class JWTUtil {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
            expiresIn: "15m",
            issuer: 'e-commerce',
            audience: 'e-commerce',
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
            issuer: 'e-commerce',
            audience: 'e-commerce',
        });
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, {
            issuer: 'e-commerce',
            audience: 'e-commerce',
        });
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET, {
            issuer: 'e-commerce',
            audience: 'e-commerce',
        });
    }
}
exports.JWTUtil = JWTUtil;
//# sourceMappingURL=jwt.js.map