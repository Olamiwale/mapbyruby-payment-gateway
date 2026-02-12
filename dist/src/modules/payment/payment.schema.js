"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookSchema = exports.paystackWebhookSchema = exports.verifyPaymentSchema = exports.initiatePaymentSchema = void 0;
const zod_1 = require("zod");
exports.initiatePaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number()
            .positive('Amount must be above 0')
            .max(10000000, 'Amount too large'),
        currency: zod_1.z
            .enum(['NGN', 'USD', 'GBP', 'EUR'])
            .default('NGN'),
        provider: zod_1.z.enum(['PAYSTACK', 'STRIPE']),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
exports.verifyPaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        reference: zod_1.z.string().min(1, 'Reference is required'),
    }),
});
//Pay-stack payment webhook
exports.paystackWebhookSchema = zod_1.z.object({
    body: zod_1.z.object({
        event: zod_1.z.string(),
        data: zod_1.z.object({
            reference: zod_1.z.string(),
            amount: zod_1.z.string(),
            status: zod_1.z.string(),
            metadata: zod_1.z.any().optional(),
        }),
    }),
});
//Stripe webhook 
exports.stripeWebhookSchema = zod_1.z.object({
    body: zod_1.z.any()
});
//# sourceMappingURL=payment.schema.js.map