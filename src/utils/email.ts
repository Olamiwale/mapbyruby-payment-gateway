import { Resend } from 'resend';
import { env } from '../config/env';
import { Logger } from './logger';

const resend = new Resend(env.RESEND_API_KEY);

const FROM = 'noreply@mapbyruby.com';
const BRAND = 'MapbyRuby';

export class EmailService {

  // ── Welcome Email ─────────────────────────────────────────
  static async sendWelcome(to: string, firstName: string) {
    try {
      await resend.emails.send({
        from: FROM,
        to,
        subject: `Welcome to ${BRAND}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Georgia, serif; background: #f5f4f0; margin: 0; padding: 40px 16px;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e6e0;">
              <div style="background: #1a1a1a; padding: 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">${BRAND}</h1>
              </div>
              <div style="padding: 40px 36px;">
                <h2 style="font-size: 20px; color: #1a1a1a; margin-bottom: 12px;">Welcome, ${firstName}.</h2>
                <p style="color: #666; line-height: 1.7; margin-bottom: 24px;">
                  Your account has been created. We're glad to have you.
                  Explore our latest collections and find something you love.
                </p>
                <a href="${env.FRONTEND_URL}/product"
                   style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none;
                          padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                  Shop Now
                </a>
              </div>
              <div style="padding: 20px 36px; border-top: 1px solid #f0ede6; text-align: center;">
                <p style="color: #bbb; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      Logger.info('Welcome email sent', { to });
    } catch (error) {
      Logger.error('Failed to send welcome email', { to, error });
      // Never throw — email failure should not break registration
    }
  }



  



  // ── Order Confirmation Email ───────────────────────────────
  static async sendOrderConfirmation(
    to: string,
    firstName: string,
    order: {
      reference: string;
      amount: number | string;
      currency: string;
      items?: Array<{ name: string; quantity: number; price: number | string }>;
      createdAt: Date;
    }
  ) {
    try {
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: order.currency || 'NGN',
        minimumFractionDigits: 0,
      }).format(Number(order.amount));

      const itemsHtml = order.items && order.items.length > 0
        ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 1px solid #f0ede6;">
                <th style="text-align: left; padding: 8px 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                <th style="text-align: center; padding: 8px 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                <th style="text-align: right; padding: 8px 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr style="border-bottom: 1px solid #f5f3ee;">
                  <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a;">${item.name}</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #666; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #1a1a1a; text-align: right; font-weight: 600;">
                    ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: order.currency || 'NGN', minimumFractionDigits: 0 }).format(Number(item.price))}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
        : '';

      await resend.emails.send({
        from: FROM,
        to,
        subject: `Order Confirmed — ${order.reference}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Georgia, serif; background: #f5f4f0; margin: 0; padding: 40px 16px;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e6e0;">
              <div style="background: #1a1a1a; padding: 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">${BRAND}</h1>
              </div>
              <div style="padding: 40px 36px;">
                <div style="text-align: center; margin-bottom: 28px;">
                  <div style="width: 52px; height: 52px; border-radius: 50%; background: #e8f5e9; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <span style="color: #2e7d32; font-size: 22px;">✓</span>
                  </div>
                  <h2 style="font-size: 20px; color: #1a1a1a; margin: 0;">Payment Confirmed</h2>
                  <p style="color: #999; font-size: 13px; margin-top: 6px;">Thank you, ${firstName}.</p>
                </div>

                <div style="background: #f9f8f5; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Reference</span>
                    <span style="font-size: 13px; color: #1a1a1a; font-weight: 600;">${order.reference}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Date</span>
                    <span style="font-size: 13px; color: #1a1a1a;">${new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Total</span>
                    <span style="font-size: 16px; color: #1a1a1a; font-weight: 700;">${formattedAmount}</span>
                  </div>
                </div>

                ${itemsHtml}

                <a href="${env.FRONTEND_URL}/profile"
                   style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none;
                          padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px;">
                  View Order History
                </a>
              </div>
              <div style="padding: 20px 36px; border-top: 1px solid #f0ede6; text-align: center;">
                <p style="color: #bbb; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      Logger.info('Order confirmation email sent', { to, reference: order.reference });
    } catch (error) {
      Logger.error('Failed to send order confirmation email', { to, error });
      
    }
  }






  

  // ── Password Reset Email ───────────────────────────────────
  static async sendPasswordReset(to: string, firstName: string, resetToken: string) {
    try {
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: FROM,
        to,
        subject: `Reset your ${BRAND} password`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Georgia, serif; background: #f5f4f0; margin: 0; padding: 40px 16px;">
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e8e6e0;">
              <div style="background: #1a1a1a; padding: 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">${BRAND}</h1>
              </div>
              <div style="padding: 40px 36px;">
                <h2 style="font-size: 20px; color: #1a1a1a; margin-bottom: 12px;">Reset your password</h2>
                <p style="color: #666; line-height: 1.7; margin-bottom: 24px;">
                  Hi ${firstName}, we received a request to reset your password.
                  Click the button below — this link expires in <strong>30 minutes</strong>.
                </p>
                <a href="${resetUrl}"
                   style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none;
                          padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                  Reset Password
                </a>
                <p style="color: #bbb; font-size: 12px; margin-top: 28px;">
                  If you didn't request this, ignore this email. Your password won't change.
                </p>
              </div>
              <div style="padding: 20px 36px; border-top: 1px solid #f0ede6; text-align: center;">
                <p style="color: #bbb; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${BRAND}. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      Logger.info('Password reset email sent', { to });
    } catch (error) {
      Logger.error('Failed to send password reset email', { to, error });
    }
  }
}