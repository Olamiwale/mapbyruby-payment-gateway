"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentUtil = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
class PaymentUtil {
    static verifyPaystackSignature(payload, signature) {
        try {
            const hash = crypto_1.default
                .createHmac('sha512', env_1.env.PAYSTACK_SECRET_KEY)
                .update(payload)
                .digest('hex');
            return hash === signature;
        }
        catch (error) {
            logger_1.Logger.security('Paystack signature verification failed', { error });
            return false;
        }
    }
    static verifyStripeSignature(payload, signature) {
        try {
            const stripe = require('stripe')(env_1.env.STRIPE_SECRET_KEY);
            stripe.webhooks.constructEvent(payload, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
            return true;
        }
        catch (error) {
            logger_1.Logger.security('Stripe signature verification failed', { error });
            return false;
        }
    }
    static generateReference(prefix = 'PAY') {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(8).toString('hex');
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }
    static toSubunit(amount, currency) {
        const multipliers = {
            NGN: 100,
            USD: 100,
            GBP: 100,
            EUR: 100,
        };
        return Math.round(amount * (multipliers[currency] || 100));
    }
    static fromSubunit(amount, currency) {
        const divisors = {
            NGN: 100,
            USD: 100,
            GBP: 100,
            EUR: 100,
        };
        return amount / (divisors[currency] || 100);
    }
}
exports.PaymentUtil = PaymentUtil;
//# sourceMappingURL=payment.js.map