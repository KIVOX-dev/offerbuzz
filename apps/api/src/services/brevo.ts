import { env } from '../config/env';
import { HttpError } from '../utils/errors';
import { renderEmail } from '../emails/templates';

const BASE = 'https://api.brevo.com/v3';

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'api-key': env().BREVO_API_KEY as string, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`Brevo ${path} failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, 'DELIVERY_FAILED', 'Could not send the email, please try again');
  }
}

/** Emails a rendered template. Without a Brevo key it is only logged in dev mode, and refused otherwise. */
export async function sendTemplateEmail(email: string, templateId: string, params: Record<string, string>): Promise<void> {
  const e = env();
  const { subject, html } = renderEmail(templateId, params);
  if (!e.BREVO_API_KEY) {
    if (e.OTP_DEV_MODE) {
      if (e.NODE_ENV !== 'test') console.log(`[email:${templateId}] ${email} -> ${subject}`);
      return;
    }
    throw new HttpError(503, 'DELIVERY_UNAVAILABLE', 'Email delivery is not configured');
  }
  await post('/smtp/email', {
    sender: { email: e.BREVO_SENDER_EMAIL, name: e.BREVO_SENDER_NAME },
    to: [{ email }],
    subject,
    htmlContent: html,
  });
}

/** Emails a one time login code. In dev mode without a Brevo key the code is only logged. */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const e = env();
  if (!e.BREVO_API_KEY) {
    if (e.OTP_DEV_MODE) {
      if (e.NODE_ENV !== 'test') console.log(`[otp] ${email} -> ${code}`);
      return;
    }
    throw new HttpError(503, 'DELIVERY_UNAVAILABLE', 'Email delivery is not configured');
  }
  const { subject, html } = renderEmail('login-code', { code, minutes: '5' });
  await post('/smtp/email', {
    sender: { email: e.BREVO_SENDER_EMAIL, name: e.BREVO_SENDER_NAME },
    to: [{ email }],
    subject,
    htmlContent: html,
  });
}
