import crypto from 'crypto';
import { env } from '../config/env';
import { Logger } from './logger';

export class PaymentUtil {
 
  static verifyPaystackSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      Logger.security('Paystack signature verification failed', { error });
      return false;
    }
  }

 
  

  static verifyStripeSignature(
    payload: string | Buffer,
    signature: string
  ): boolean {
    try {
      const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
      stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
      return true;
    } catch (error) {
      Logger.security('Stripe signature verification failed', { error });
      return false;
    }
  }

 
  

  static generateReference(prefix: string = 'PAY'): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

 


  static toSubunit(amount: number, currency: string): number {
    const multipliers: Record<string, number> = {
      NGN: 100, 
      USD: 100, 
      GBP: 100, 
      EUR: 100, 
    };

    return Math.round(amount * (multipliers[currency] || 100));
  }

 


  static fromSubunit(amount: number, currency: string): number {
    const divisors: Record<string, number> = {
      NGN: 100,
      USD: 100,
      GBP: 100,
      EUR: 100,
    };

    return amount / (divisors[currency] || 100);
  }
}