"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.authenticate, auth_1.adminOnly);
router.get('/orders', admin_controller_1.AdminController.getOrders);
router.get('/customers', admin_controller_1.AdminController.getCustomers);
router.patch('/orders/:id/status', admin_controller_1.AdminController.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map