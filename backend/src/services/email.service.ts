/**
 * Email Service
 * Sends transactional emails via Resend API
 */

import { config } from '../config/env';
import logger from '../utils/logger';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = config.email.resendApiKey;
  if (!apiKey) {
    logger.warn('[EMAIL] RESEND_API_KEY not set – skipping email send');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.email.from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error(`[EMAIL] Resend API error (${response.status}): ${error}`);
    throw new Error(`Failed to send email: ${error}`);
  }

  const result = await response.json() as { id?: string };
  logger.info(`[EMAIL] Sent to ${to} – id: ${result.id}`);
}

/**
 * Send OTP verification email after registration
 */
export async function sendVerificationEmail(
  email: string,
  fullName: string,
  otp: string
): Promise<void> {
  const subject = 'Your TowMe Verification Code';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#003554;font-size:28px;margin:0;">TowMe</h1>
        <p style="color:#6b7280;margin:4px 0 0;">Roadside Assistance</p>
      </div>
      <div style="background:#ffffff;border-radius:8px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Hi ${fullName},</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
          Welcome to TowMe! Use the verification code below to confirm your email address.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="color:#6b7280;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
          <p style="color:#003554;font-size:40px;font-weight:700;letter-spacing:12px;margin:0;">${otp}</p>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;">
          If you didn't create a TowMe account, you can safely ignore this email.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        &copy; ${new Date().getFullYear()} TowMe. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail(email, subject, html);
  logger.info(`[EMAIL] Verification OTP sent to ${email}`);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${config.email.frontendUrl}/screens/auth/reset-password-screen?token=${resetToken}`;
  const subject = 'Reset Your TowMe Password';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#003554;font-size:28px;margin:0;">TowMe</h1>
        <p style="color:#6b7280;margin:4px 0 0;">Roadside Assistance</p>
      </div>
      <div style="background:#ffffff;border-radius:8px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Hi ${fullName},</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
          We received a request to reset your password. Click the button below to set a new password.
          This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#003554;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            Reset Password
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        &copy; ${new Date().getFullYear()} TowMe. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail(email, subject, html);
  logger.info(`[EMAIL] Password reset email sent to ${email}`);
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  const subject = 'Welcome to TowMe!';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#003554;font-size:28px;margin:0;">TowMe</h1>
        <p style="color:#6b7280;margin:4px 0 0;">Roadside Assistance</p>
      </div>
      <div style="background:#ffffff;border-radius:8px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Welcome, ${fullName}!</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          Your account has been verified. You're all set to use TowMe for fast, reliable roadside assistance.
        </p>
        <p style="color:#374151;line-height:1.6;margin:0;">
          Open the app to get started. Help is always just a tap away.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        &copy; ${new Date().getFullYear()} TowMe. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail(email, subject, html);
}
