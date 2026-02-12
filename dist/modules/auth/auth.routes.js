"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validator_1 = require("../../middleware/validator");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
// Public routes with strict rate limiting
router.post('/register', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh', rateLimiter_1.authLimiter, (0, validator_1.validate)(auth_schema_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
// Protected routes
router.post('/logout', auth_1.authenticate, auth_controller_1.AuthController.logout);
router.get('/profile', auth_1.authenticate, auth_controller_1.AuthController.getProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map