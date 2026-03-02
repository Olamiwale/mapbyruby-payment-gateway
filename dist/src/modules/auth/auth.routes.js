"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validator_1 = require("../../middleware/validator");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
// Session restore
router.get('/me', auth_controller_1.AuthController.getMe);
// Password reset — public, rate limited
router.post('/forgot-password', rateLimiter_1.authLimiter, auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', rateLimiter_1.authLimiter, auth_controller_1.AuthController.resetPassword);
// Protected routes
router.post('/logout', auth_1.authenticate, auth_controller_1.AuthController.logout);
router.get('/profile', auth_1.authenticate, auth_controller_1.AuthController.getProfile);
exports.default = router;
// import { Router } from 'express';
// import { AuthController } from './auth.controller';
// import { validate } from '../../middleware/validator';
// import { authenticate } from '../../middleware/auth';
// import { authLimiter } from '../../middleware/rateLimiter';
// import {
//   registerSchema,
//   loginSchema,
//   refreshTokenSchema,
// } from './auth.schema';
// const router = Router();
// // Public routes
// router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
// router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
// router.post('/refresh', authLimiter, validate(refreshTokenSchema), AuthController.refreshToken);
// // Session restore — no authenticate middleware, reads httpOnly cookie directly
// router.get('/me', AuthController.getMe);
// // Protected routes
// router.post('/logout', authenticate, AuthController.logout);
// router.get('/profile', authenticate, AuthController.getProfile);
// export default router;
/*
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validator';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.schema';

const router = Router();

// Public routes with strict rate limiting
router.post('/register', authLimiter, validate(registerSchema),  AuthController.register);

router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

router.post('/refresh', authLimiter, validate(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

export default router; */
//123@Qazxsd
//# sourceMappingURL=auth.routes.js.map