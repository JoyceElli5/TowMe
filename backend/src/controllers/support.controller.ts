import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/api.types';

export async function sendSupportMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { subject, message } = req.body;

  if (!subject || !message) {
    res.status(400).json({ success: false, error: 'Subject and message are required' });
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: { name: req.user?.email || 'TowMe User', email: 'noreply@towme.com' },
        to: [{ email: 'support@towme.com', name: 'TowMe Support' }],
        replyTo: { email: req.user?.email },
        subject,
        textContent: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Brevo API error: ${response.status}`);
    }

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Support contact error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
}
