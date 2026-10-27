import { env } from '../config/env';
import { HttpError } from '../utils/errors';

const BASE = 'https://api.brevo.com/v3';

async function post(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'api-key': env().BREVO_API_KEY as string, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`Brevo ${path} failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, 'DELIVERY_FAILED', 'Could not send the code, please try again');
  }
}

/** Delivers a one time code by SMS (phone) or email. In dev mode the code is only logged. */
export async function sendOtpMessage(identifier: string, code: string): Promise<void> {
  const e = env();
  const minutes = 5;
  if (!e.BREVO_API_KEY) {
    if (e.OTP_DEV_MODE) {
      if (e.NODE_ENV !== 'test') console.log(`[otp] ${identifier} -> ${code}`);
      return;
    }
    throw new HttpError(503, 'DELIVERY_UNAVAILABLE', 'Code delivery is not configured');
  }
  if (identifier.startsWith('+')) {
    await post('/transactionalSMS/sms', {
      sender: e.BREVO_SMS_SENDER,
      recipient: identifier.replace('+', ''),
      content: `${code} is your OfferBuzz code. Valid for ${minutes} minutes. Do not share it.`,
      type: 'transactional',
    });
  } else {
    await post('/smtp/email', {
      sender: { email: e.BREVO_SENDER_EMAIL, name: e.BREVO_SENDER_NAME },
      to: [{ email: identifier }],
      subject: 'Your OfferBuzz login code',
      htmlContent: `<p>Your OfferBuzz code is <b style="font-size:20px">${code}</b>.</p><p>It is valid for ${minutes} minutes. If you did not ask for it, ignore this email.</p>`,
    });
  }
}
