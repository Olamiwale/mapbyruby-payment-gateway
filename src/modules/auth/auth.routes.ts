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

export default router;