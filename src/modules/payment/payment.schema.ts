import { z } from 'zod';


export const initiatePaymentSchema = z.object({
    body: z.object({
        amount: z
        .number()
        .positive('Amount must be above 0')
        .max(10000000, 'Amount too large'),

        currency: z
        .enum(['NGN', 'USD', 'GBP', 'EUR'])
        .default('NGN'),

        provider: z.enum(['PAYSTACK', 'STRIPE']),
        metadata: z.record(z.string(), z.any()).optional(),
 

    }),
});



export const verifyPaymentSchema = z.object({
    params: z.object({
        reference: z.string().min(1, 'Reference is required'),
    }),
});

//Pay-stack payment webhook
export const paystackWebhookSchema = z.object({
    body: z.object({
        event: z.string(),
        data: z.object({
            reference: z.string(),
            amount: z.string(),
            status: z.string(),
            metadata: z.any().optional(),
        }),
    }),
});

//Stripe webhook 
export const stripeWebhookSchema = z.object({
    body: z.any()
});


export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>['body'];
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>['params'];


