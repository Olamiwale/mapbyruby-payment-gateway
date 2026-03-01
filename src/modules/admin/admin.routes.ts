import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, adminOnly } from '../../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, adminOnly);

router.get('/orders', AdminController.getOrders);
router.get('/customers', AdminController.getCustomers);
router.patch('/orders/:id/status', AdminController.updateOrderStatus);

export default router;