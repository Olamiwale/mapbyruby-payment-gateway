"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
class AdminController {
    // GET /admin/orders — all orders with customer, payment, items
    static async getOrders(req, res, next) {
        try {
            const orders = await database_1.default.order.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    // GET /admin/customers — all customers with order count
    static async getCustomers(req, res, next) {
        try {
            const customers = await database_1.default.user.findMany({
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
        }
        catch (error) {
            next(error);
        }
    }
    // PATCH /admin/orders/:id/status — update order status
    static async updateOrderStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
            if (!validStatuses.includes(status)) {
                throw new errorHandler_1.AppError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }
            const order = await database_1.default.order.update({
                where: { id },
                data: { status },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    payment: { select: { amount: true, currency: true } },
                },
            });
            res.status(200).json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map