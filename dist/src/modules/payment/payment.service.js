"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const payment_1 = require("../../config/payment");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
const payment_2 = require("../../utils/payment");
const axios_1 = __importDefault(require("axios"));
class PaymentService {
    static async initiatePaystack(userId, data) {
        try {
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { email: true },
            });
            if (!user) {
                throw new errorHandler_1.AppError(404, 'User not found');
            }
            const reference = payment_2.PaymentUtil.generateReference('PAYSTACK');
            const amountInKobo = payment_2.PaymentUtil.toSubunit(data.amount, data.currency);
            const order = await database_1.default.order.create({
                data: {
                    userId,
                    totalAmount: data.amount,
                    status: 'PENDING',
                },
            });
            // Initialize Pay-stack transaction
            const response = await axios_1.default.post(`${payment_1.paystackConfig.baseURL}/transaction/initialize`, {
                email: user.email,
                amount: amountInKobo,
                currency: data.currency,
                reference,
                metadata: {
                    orderId: order.id,
                    userId,
                    ...data.metadata,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${payment_1.paystackConfig.secretKey}`,
                    'Content-Type': 'application/json',
                },
            });
            // Create payment record after initialization
            const payment = await database_1.default.payment.create({
                data: {
                    orderId: order.id,
                    userId,
                    amount: data.amount,
                    currency: data.currency,
                    provider: 'PAYSTACK',
                    providerReference: reference,
                    status: 'PENDING',
                    metadata: data.metadata,
                },
            });
            //log information about the payment details
            logger_1.Logger.info('Paystack payment initiated', {
                paymentId: payment.id,
                reference,
            });
            return {
                paymentId: payment.id,
                orderId: order.id,
                reference,
                authorizationUrl: response.data.data.authorization_url,
                accessCode: response.data.data.access_code,
            };
        }
        //catch error if there is any during payment
        catch (error) {
            logger_1.Logger.error('Paystack payment initiation failed', error);
            if (error.response?.data) {
                throw new errorHandler_1.AppError(400, error.response.data.message || 'Payment initiation failed');
            }
            throw new errorHandler_1.AppError(500, 'Failed to initiate payment');
        }
    }
    // Initiate Stripe Payment
    static async initiateStripe(userId, data) {
        try {
            const reference = payment_2.PaymentUtil.generateReference('STRIPE');
            const amountInCents = payment_2.PaymentUtil.toSubunit(data.amount, data.currency);
            // Get user details
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { email: true, firstName: true, lastName: true },
            });
            if (!user) {
                throw new errorHandler_1.AppError(404, 'User not found');
            }
            // Create order with stripe payment
            const order = await database_1.default.order.create({
                data: {
                    userId,
                    totalAmount: data.amount,
                    status: 'PENDING',
                },
            });
            // Create Stripe payment intent
            const paymentIntent = await payment_1.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: data.currency.toLowerCase(),
                metadata: {
                    orderId: order.id,
                    userId,
                    reference,
                    ...data.metadata,
                },
                description: `Order #${order.id}`,
                receipt_email: user.email,
            });
            // Create payment record
            const payment = await database_1.default.payment.create({
                data: {
                    orderId: order.id,
                    userId,
                    amount: data.amount,
                    currency: data.currency,
                    provider: 'STRIPE',
                    providerReference: reference,
                    status: 'PENDING',
                    metadata: {
                        paymentIntentId: paymentIntent.id,
                        ...data.metadata,
                    },
                },
            });
            logger_1.Logger.info('Stripe payment initiated', {
                paymentId: payment.id,
                reference,
                paymentIntentId: paymentIntent.id,
            });
            return {
                paymentId: payment.id,
                orderId: order.id,
                reference,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            };
        }
        catch (error) {
            logger_1.Logger.error('Stripe payment initiation failed', error);
            throw new errorHandler_1.AppError(500, 'Failed to initiate payment');
        }
    }
    // Verify Pay-stack Payment
    static async verifyPaystack(reference) {
        try {
            const response = await axios_1.default.get(`${payment_1.paystackConfig.baseURL}/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${payment_1.paystackConfig.secretKey}`,
                },
            });
            const { data } = response.data;
            // Find payment record
            const payment = await database_1.default.payment.findUnique({
                where: { providerReference: reference },
                include: { order: true },
            });
            if (!payment) {
                throw new errorHandler_1.AppError(404, 'Payment not found');
            }
            // Update payment status after initialization
            const status = data.status === 'success' ? 'SUCCESS' : 'FAILED';
            await database_1.default.$transaction([
                database_1.default.payment.update({
                    where: { id: payment.id },
                    data: { status },
                }),
                database_1.default.order.update({
                    where: { id: payment.orderId },
                    data: {
                        status: status === 'SUCCESS' ? 'COMPLETED' : 'CANCELLED',
                    },
                }),
            ]);
            logger_1.Logger.info('Paystack payment verified', {
                paymentId: payment.id,
                status,
            });
            return {
                success: status === 'SUCCESS',
                payment,
                providerData: data,
            };
        }
        catch (error) {
            logger_1.Logger.error('Paystack verification failed', error);
            if (error.response?.data) {
                throw new errorHandler_1.AppError(400, error.response.data.message || 'Verification failed');
            }
            throw new errorHandler_1.AppError(500, 'Failed to verify payment');
        }
    }
    // Verify Stripe Payment
    static async verifyStripe(paymentIntentId) {
        try {
            const paymentIntent = await payment_1.stripe.paymentIntents.retrieve(paymentIntentId);
            // Find payment by metadata
            const payment = await database_1.default.payment.findFirst({
                where: {
                    metadata: {
                        path: ['paymentIntentId'],
                        equals: paymentIntentId,
                    },
                },
                include: { order: true },
            });
            if (!payment) {
                throw new errorHandler_1.AppError(404, 'Payment not found');
            }
            // Update payment status
            const status = paymentIntent.status === 'succeeded' ? 'SUCCESS' : 'FAILED';
            await database_1.default.$transaction([
                database_1.default.payment.update({
                    where: { id: payment.id },
                    data: { status },
                }),
                database_1.default.order.update({
                    where: { id: payment.orderId },
                    data: {
                        status: status === 'SUCCESS' ? 'COMPLETED' : 'CANCELLED',
                    },
                }),
            ]);
            logger_1.Logger.info('Stripe payment verified', {
                paymentId: payment.id,
                status,
            });
            return {
                success: status === 'SUCCESS',
                payment,
                providerData: paymentIntent,
            };
        }
        catch (error) {
            logger_1.Logger.error('Stripe verification failed', error);
            throw new errorHandler_1.AppError(500, 'Failed to verify payment');
        }
    }
    // Handle Paystack Webhook
    static async handlePaystackWebhook(event, data) {
        try {
            if (event === 'charge.success') {
                const payment = await database_1.default.payment.findUnique({
                    where: { providerReference: data.reference },
                });
                if (!payment) {
                    logger_1.Logger.warn('Webhook for unknown payment', {
                        reference: data.reference
                    });
                    return;
                }
                if (payment.status === 'SUCCESS') {
                    logger_1.Logger.info('Webhook already processed', {
                        paymentId: payment.id,
                    });
                    return;
                }
                await database_1.default.$transaction([
                    database_1.default.payment.update({
                        where: { id: payment.id },
                        data: { status: 'SUCCESS'
                        },
                    }),
                    database_1.default.order.update({
                        where: { id: payment.orderId },
                        data: { status: 'COMPLETED' },
                    }),
                ]);
                logger_1.Logger.info('Paystack webhook processed', { paymentId: payment.id });
            }
        }
        catch (error) {
            logger_1.Logger.error('Paystack webhook processing failed', error);
            throw error;
        }
    }
    // Handle Stripe Webhook
    static async handleStripeWebhook(event) {
        try {
            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object;
                const payment = await database_1.default.payment.findFirst({
                    where: {
                        metadata: {
                            path: ['paymentIntentId'],
                            equals: paymentIntent.id,
                        },
                    },
                });
                if (!payment) {
                    logger_1.Logger.warn('Webhook for unknown payment', {
                        paymentIntentId: paymentIntent.id,
                    });
                    return;
                }
                await database_1.default.$transaction([
                    database_1.default.payment.update({
                        where: { id: payment.id },
                        data: { status: 'SUCCESS' },
                    }),
                    database_1.default.order.update({
                        where: { id: payment.orderId },
                        data: { status: 'COMPLETED' },
                    }),
                ]);
                logger_1.Logger.info('Stripe webhook processed', { paymentId: payment.id });
            }
        }
        catch (error) {
            logger_1.Logger.error('Stripe webhook processing failed', error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map