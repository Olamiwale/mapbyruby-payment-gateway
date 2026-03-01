import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class AdminController {

  // GET /admin/orders — all orders with customer, payment, items
  static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: true,
          payment: {
            select: { amount: true, currency: true, status: true, providerReference: true },
          },
        },
      });

      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /admin/customers — all customers with order count
  static async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customers = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      });

      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /admin/orders/:id/status — update order status
  static async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { amount: true, currency: true } },
        },
      });

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
}