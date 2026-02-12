import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validate } from '../../middleware/validator';
import { authenticate } from '../../middleware/auth';
import { paymentLimiter } from '../../middleware/rateLimiter';
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
} from './payment.schema';
import express from 'express';

const router = Router();

// Protected payment routes (require authentication)

router.post( '/initiate',  
  authenticate,  
  paymentLimiter, 
  validate(initiatePaymentSchema),
  PaymentController.initiatePayment
);

router.get( '/verify/:reference',
  authenticate,
  validate(verifyPaymentSchema),
  PaymentController.verifyPayment
);

router.get('/my-payments',
  authenticate,
  PaymentController.getUserPayments
);

router.get('/:id',
  authenticate,
  PaymentController.getPayment
);

// Webhook routes (public but signature-verified)
// IMPORTANT: Webhooks need raw body for signature verification
router.post('/webhook/paystack',
  express.json({ 
    verify: (req, res, buf) => { 
      (req as any).rawBody = buf; 
    }, 
  }),
  PaymentController.paystackWebhook
);



router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  PaymentController.stripeWebhook
);

export default router;