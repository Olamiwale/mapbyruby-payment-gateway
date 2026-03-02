"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("./payment.service");
const payment_1 = require("../../utils/payment");
const logger_1 = require("../../utils/logger");
const payment_2 = require("../../config/payment");
const env_1 = require("../../config/env");
const database_1 = __importDefault(require("../../config/database"));
class PaymentController {
    static async initiatePayment(req, res, next) {
        try {
            const userId = req.user.userId;
            const { provider } = req.body;
            let result;
            if (provider === 'PAYSTACK') {
                result = await payment_service_1.PaymentService.initiatePaystack(userId, req.body);
            }
            else if (provider === 'STRIPE') {
                result = await payment_service_1.PaymentService.initiateStripe(userId, req.body);
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment provider',
                });
            }
            res.status(201).json({
                success: true,
                message: 'Payment initiated successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyPayment(req, res, next) {
        try {
            const { reference } = req.params;
            // Determine provider from reference prefix
            let result;
            if (reference.startsWith('PAYSTACK_')) {
                result = await payment_service_1.PaymentService.verifyPaystack(reference);
            }
            else if (reference.startsWith('STRIPE_')) {
                // For Stripe, reference is actually the paymentIntentId
                result = await payment_service_1.PaymentService.verifyStripe(reference);
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment reference',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Paystack webhook handler
    static async paystackWebhook(req, res, next) {
        try {
            const signature = req.headers['x-paystack-signature'];
            const payload = JSON.stringify(req.body);
            if (!signature || !payment_1.PaymentUtil.verifyPaystackSignature(payload, signature)) {
                logger_1.Logger.security('Invalid Paystack webhook signature', {
                    ip: req.ip,
                });
                return res.status(401).json({
                    success: false,
                    message: 'Invalid signature',
                });
            }
            const { event, data } = req.body;
            await payment_service_1.PaymentService.handlePaystackWebhook(event, data);
            res.status(200).json({
                success: true,
                message: 'Webhook processed',
            });
        }
        catch (error) {
            logger_1.Logger.error('Paystack webhook error', error);
            // Always return 200 to prevent webhook retries on our errors
            res.status(500).json({
                message: 'Webhook processing failed',
            });
        }
    }
    // Stripe webhook handler
    static async stripeWebhook(req, res, next) {
        try {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                logger_1.Logger.security('Missing Stripe webhook signature', {
                    ip: req.ip,
                });
                return res.status(400).json({
                    success: false,
                    message: 'Missing signature',
                });
            }
            // Verify webhook signature and construct event
            let event;
            try {
                event = payment_2.stripe.webhooks.constructEvent(req.body, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
            }
            catch (err) {
                logger_1.Logger.security('Invalid Stripe webhook signature', {
                    ip: req.ip,
                    error: err.message,
                });
                return res.status(400).json({
                    success: false,
                    message: 'Invalid signature',
                });
            }
            await payment_service_1.PaymentService.handleStripeWebhook(event);
            res.status(200).json({
                success: true,
                message: 'Webhook processed',
            });
        }
        catch (error) {
            logger_1.Logger.error('Stripe webhook error', error);
            // Always return 200 to prevent webhook retries
            res.status(200).json({
                success: false,
                message: 'Webhook processing failed',
            });
        }
    }
    // Get user's payments
    static async getUserPayments(req, res, next) {
        try {
            const userId = req.user.userId;
            const payments = await database_1.default.payment.findMany({
                where: { userId },
                include: {
                    order: {
                        select: {
                            id: true,
                            totalAmount: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({
                success: true,
                data: payments,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get single payment
    static async getPayment(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const payment = await database_1.default.payment.findFirst({
                where: {
                    id,
                    userId, // Ensure user owns this payment
                },
                include: {
                    order: {
                        include: {
                            items: true,
                        },
                    },
                },
            });
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found',
                });
            }
            res.status(200).json({
                success: true,
                data: payment,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map