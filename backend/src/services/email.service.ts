/**
 * Email Service
 * Sends transactional emails via Brevo SMTP using Nodemailer.
 */

import nodemailer from 'nodemailer';
import { config } from '../config/env';
import logger from '../utils/logger';

// Create a single reusable transporter (connection pooling)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: false, // STARTTLS on port 587
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPass,
    },
    pool: true,        // keep connections open for reuse
    maxConnections: 5,
  });

  return transporter;
}

async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  html: string
): Promise<void> {
  if (!config.email.smtpUser || !config.email.smtpPass) {
    logger.warn(`[EMAIL] SMTP credentials not set – skipping send to ${to}`);
    if (config.nodeEnv !== 'production') {
      logger.info(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
      // Print HTML content in dev so OTPs are visible in logs
      const otpMatch = html.match(/\b(\d{6})\b/);
      if (otpMatch) logger.info(`[EMAIL DEV] OTP: ${otpMatch[1]}`);
    }
    return;
  }

  const info = await getTransporter().sendMail({
    from: `"${config.email.fromName}" <${config.email.from}>`,
    to: toName ? `"${toName}" <${to}>` : to,
    subject,
    html,
  });

  logger.info(`[EMAIL] Sent "${subject}" to ${to} – messageId: ${info.messageId}`);
}

/* ─── Shared template wrapper ──────────────────────────────────── */

function baseWrapper(content: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#003554;font-size:28px;margin:0;">TowMe</h1>
        <p style="color:#6b7280;margin:4px 0 0;font-size:13px;">Roadside Assistance</p>
      </div>
      <div style="background:#ffffff;border-radius:8px;padding:24px;margin-bottom:24px;">
        ${content}
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
        &copy; ${new Date().getFullYear()} TowMe. All rights reserved.
      </p>
    </div>
  `;
}

/* ─── Public functions ──────────────────────────────────────────── */

/**
 * Send 6-digit OTP verification email
 */
export async function sendVerificationEmail(
  email: string,
  fullName: string,
  otp: string
): Promise<void> {
  const html = baseWrapper(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Hi ${fullName},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
      Welcome to TowMe! Use the code below to verify your email address.
      It expires in <strong>10 minutes</strong>.
    </p>
    <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">
        Verification Code
      </p>
      <p style="color:#003554;font-size:40px;font-weight:700;letter-spacing:12px;margin:0;">
        ${otp}
      </p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0;">
      If you didn't create a TowMe account, you can safely ignore this email.
    </p>
  `);

  await sendEmail(email, fullName, 'Your TowMe Verification Code', html);
}

/**
 * Send password-reset email with a clickable link
 */
export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${config.email.frontendUrl}/screens/auth/reset-password-screen?token=${resetToken}`;

  const html = baseWrapper(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Hi ${fullName},</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
      We received a request to reset your TowMe password.
      Click the button below to set a new one.
      This link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetUrl}"
         style="display:inline-block;background:#003554;color:#ffffff;padding:14px 32px;
                border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Reset Password
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);

  await sendEmail(email, fullName, 'Reset Your TowMe Password', html);
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  const html = baseWrapper(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Welcome, ${fullName}!</h2>
    <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
      Your account has been verified. You're all set to use TowMe for fast,
      reliable roadside assistance.
    </p>
    <p style="color:#374151;line-height:1.6;margin:0;">
      Open the app to get started — help is always just a tap away.
    </p>
  `);

  await sendEmail(email, fullName, 'Welcome to TowMe!', html);
}
