"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const validator_1 = require("../../middleware/validator");
const auth_1 = require("../../middleware/auth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const payment_schema_1 = require("./payment.schema");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
// Protected payment routes (require authentication)
router.post('/initiate', auth_1.authenticate, rateLimiter_1.paymentLimiter, (0, validator_1.validate)(payment_schema_1.initiatePaymentSchema), payment_controller_1.PaymentController.initiatePayment);
router.get('/verify/:reference', auth_1.authenticate, (0, validator_1.validate)(payment_schema_1.verifyPaymentSchema), payment_controller_1.PaymentController.verifyPayment);
router.get('/my-payments', auth_1.authenticate, payment_controller_1.PaymentController.getUserPayments);
router.get('/:id', auth_1.authenticate, payment_controller_1.PaymentController.getPayment);
// Webhook routes (public but signature-verified)
// IMPORTANT: Webhooks need raw body for signature verification
router.post('/webhook/paystack', express_2.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}), payment_controller_1.PaymentController.paystackWebhook);
router.post('/webhook/stripe', express_2.default.raw({ type: 'application/json' }), payment_controller_1.PaymentController.stripeWebhook);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map