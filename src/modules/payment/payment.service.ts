import prisma from '../../config/database';
import { stripe, paystackConfig } from '../../config/payment';
import { AppError } from '../../middleware/errorHandler';
import { Logger } from '../../utils/logger';
import { PaymentUtil } from '../../utils/payment';
import { InitiatePaymentInput } from '../payment/payment.schema';
import axios from 'axios';
import { Prisma } from "@prisma/client";


export class PaymentService {

 
  static async initiatePaystack( 
    userId: string,  
    data: InitiatePaymentInput ){
    try {
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

 
      if (!user) { throw new AppError(404, 'User not found'); }

      const reference = PaymentUtil.generateReference('PAYSTACK');
      const amountInKobo = PaymentUtil.toSubunit(data.amount, data.currency);
 
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: data.amount,
          status: 'PENDING',
        },
      });


      // Initialize Pay-stack transaction
      const response = await axios.post(
        `${paystackConfig.baseURL}/transaction/initialize`,
        {
          email: user.email,
          amount: amountInKobo,
          currency: data.currency,
          reference,
          metadata: {
            orderId: order.id,
            userId,
            ...data.metadata,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${paystackConfig.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Create payment record after initialization
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId,
          amount: data.amount,
          currency: data.currency,
          provider: 'PAYSTACK',
          providerReference: reference,
          status: 'PENDING',
          metadata: data.metadata as Prisma.InputJsonValue,

        },
      });

      //log information about the payment details
      Logger.info('Paystack payment initiated', {
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
    catch (error: any) {
      Logger.error('Paystack payment initiation failed', error);
      
      if (error.response?.data) {
        throw new AppError(400, error.response.data.message || 'Payment initiation failed');
      }
      
      throw new AppError(500, 'Failed to initiate payment');
    }
  }






  // Initiate Stripe Payment
  static async initiateStripe( userId: string, data: InitiatePaymentInput ) {
    try {
      const reference = PaymentUtil.generateReference('STRIPE');
      const amountInCents = PaymentUtil.toSubunit(data.amount, data.currency);

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user) { throw new AppError(404, 'User not found'); }

      // Create order with stripe payment
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: data.amount,
          status: 'PENDING',
        },
      });

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
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
      const payment = await prisma.payment.create({
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

      Logger.info('Stripe payment initiated', {
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
      catch (error: any) {
      Logger.error('Stripe payment initiation failed', error);
      throw new AppError(500, 'Failed to initiate payment');
    }
  }


  // Verify Pay-stack Payment
  static async verifyPaystack(reference: string) {
    try {
      const response = await axios.get(
        `${paystackConfig.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${paystackConfig.secretKey}`,
          },
        },
      );

      const { data } = response.data;

      // Find payment record
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
        include: { order: true },
      });

      if (!payment) { throw new AppError(404, 'Payment not found'); }


      // Update payment status after initialization
      const status = data.status === 'success' ? 'SUCCESS' : 'FAILED';

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status },
        }),

        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: status === 'SUCCESS' ? 'COMPLETED' : 'CANCELLED',
          },
        }),
      ]);

      Logger.info('Paystack payment verified', {
        paymentId: payment.id,
        status,
      });

      return {
        success: status === 'SUCCESS',
        payment,
        providerData: data,
      };
    } 
      catch (error: any) {
      Logger.error('Paystack verification failed', error);
      
      if (error.response?.data) {
        throw new AppError(400, error.response.data.message || 'Verification failed');
      }
      
      throw new AppError(500, 'Failed to verify payment');
    }
  }



  // Verify Stripe Payment
  static async verifyStripe(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Find payment by metadata
      const payment = await prisma.payment.findFirst({
        where: {
          metadata: {
            path: ['paymentIntentId'],
            equals: paymentIntentId,
          },
        },
        include: { order: true },
      });

      if (!payment) {
        throw new AppError(404, 'Payment not found');
      }

      // Update payment status
      const status = paymentIntent.status === 'succeeded' ? 'SUCCESS' : 'FAILED';

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: status === 'SUCCESS' ? 'COMPLETED' : 'CANCELLED',
          },
        }),
      ]);

      Logger.info('Stripe payment verified', {
        paymentId: payment.id,
        status,
      });

      return {
        success: status === 'SUCCESS',
        payment,
        providerData: paymentIntent,
      };
    } catch (error: any) {
      Logger.error('Stripe verification failed', error);
      throw new AppError(500, 'Failed to verify payment');
    }
  }


  

  // Handle Paystack Webhook
  static async handlePaystackWebhook(event: string, data: any) {
    try {
      if (event === 'charge.success') {
        const payment = await prisma.payment.findUnique({
          where: { providerReference: data.reference },
        });

        if (!payment) {
          Logger.warn('Webhook for unknown payment', { 
            reference: data.reference 
          });
          return;
        }

        
       if (payment.status === 'SUCCESS'){
        Logger.info('Webhook already processed', {
          paymentId: payment.id,
        });
        return;
       }




        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS'
             },
          }),


          prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'COMPLETED' }, 
          }),
        ]);

        Logger.info('Paystack webhook processed', { paymentId: payment.id });
      }
    } catch (error) {
      Logger.error('Paystack webhook processing failed', error);
      throw error;
    }
  }



  // Handle Stripe Webhook
  static async handleStripeWebhook(event: any) {
    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;

        const payment = await prisma.payment.findFirst({
          where: {
            metadata: {
              path: ['paymentIntentId'],
              equals: paymentIntent.id,
            },
          },
        });

        if (!payment) {
          Logger.warn('Webhook for unknown payment', {
            paymentIntentId: paymentIntent.id,
          });
          return;
        }

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS' },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'COMPLETED' },
          }),
        ]);

        Logger.info('Stripe webhook processed', { paymentId: payment.id });
      }
    } catch (error) {
      Logger.error('Stripe webhook processing failed', error);
      throw error;
    }
  }
}