import { Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { AuthRequest } from '../../middleware/auth';
import { InitiatePaymentInput, VerifyPaymentInput } from './payment.schema';
import { PaymentUtil } from '../../utils/payment';
import { Logger } from '../../utils/logger';
import { stripe } from '../../config/payment';
import { env } from '../../config/env';
import prisma from '../../config/database';

export class PaymentController {

  static async initiatePayment(
    req: AuthRequest<{}, {}, InitiatePaymentInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.userId;
      const { provider } = req.body;

      let result;

      if (provider === 'PAYSTACK') {
        result = await PaymentService.initiatePaystack(userId, req.body);
      } else if (provider === 'STRIPE') {
        result = await PaymentService.initiateStripe(userId, req.body);
      } else {
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
    } catch (error) {
      next(error);
    }
  }


  static async verifyPayment(
    req: AuthRequest<VerifyPaymentInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { reference } = req.params;

      // Determine provider from reference prefix
      let result;

      if (reference.startsWith('PAYSTACK_')) {
        result = await PaymentService.verifyPaystack(reference);
      } else if (reference.startsWith('STRIPE_')) {
        // For Stripe, reference is actually the paymentIntentId
        result = await PaymentService.verifyStripe(reference);
      } else {
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
    } catch (error) {
      next(error);
    }
  }


  // Paystack webhook handler
  static async paystackWebhook( 
    req: any, 
    res: Response, 
    next: NextFunction ) {

    try {

      const signature = req.headers['x-paystack-signature'];
      const payload = JSON.stringify(req.body);

      if (!signature || !PaymentUtil.verifyPaystackSignature(payload, signature as string)) {
        Logger.security('Invalid Paystack webhook signature', {
          ip: req.ip,
        });
        return res.status(401).json({
          success: false,
          message: 'Invalid signature',
        });
      }

      const { event, data } = req.body;

      await PaymentService.handlePaystackWebhook(event, data);

      res.status(200).json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error) {
      Logger.error('Paystack webhook error', error);
      // Always return 200 to prevent webhook retries on our errors

      res.status(500).json({  
        message: 'Webhook processing failed',
      });
    }
  }

  



  // Stripe webhook handler
  static async stripeWebhook(
    req: any,
    res: Response,
    next: NextFunction
  ) {
    try {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        Logger.security('Missing Stripe webhook signature', {
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
        event = stripe.webhooks.constructEvent(
          req.body,
          signature as string,
          env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        Logger.security('Invalid Stripe webhook signature', {
          ip: req.ip,
          error: err.message,
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid signature',
        });
      }

      await PaymentService.handleStripeWebhook(event);

      res.status(200).json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error) {
      Logger.error('Stripe webhook error', error);
      // Always return 200 to prevent webhook retries
      res.status(200).json({
        success: false,
        message: 'Webhook processing failed',
      });
    }
  }



  // Get user's payments
  static async getUserPayments(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.userId;

      const payments = await prisma.payment.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  // Get single payment
  static async getPayment(
    req: AuthRequest<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const payment = await prisma.payment.findFirst({
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
    } catch (error) {
      next(error);
    }
  }
}