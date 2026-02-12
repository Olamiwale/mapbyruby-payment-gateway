import Stripe from 'stripe';
import { env } from './env';


export const stripe =  new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
});



export const paystackConfig = {
    secretKey: env.PAYSTACK_SECRET_KEY,
    publicKey: env.PAYSTACK_PUBLIC_KEY,
    baseURL: 'https://api.paystack.co',
}