import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { MERCHANT_PLANS, planAmount, type CreateOrderInput, type CreateOrderResponse, type VerifyPaymentResponse } from '@offerbuzz/shared';
import { env } from '../../config/env';
import { Payment } from '../../models/Payment';
import { Subscription } from '../../models/Subscription';
import { HttpError, badRequest, forbidden, notFound } from '../../utils/errors';
import { extendSubscription } from '../subscription/subscription.service';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function keys() {
  const { RAZORPAY_KEY_ID: id, RAZORPAY_KEY_SECRET: secret } = env();
  if (!id || !secret) throw new HttpError(503, 'PAYMENTS_NOT_CONFIGURED', 'Online payment is not available right now. Please try again later.');
  return { id, secret };
}

const hmac = (secret: string, data: string | Buffer) => crypto.createHmac('sha256', secret).update(data).digest('hex');

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Step 1: the merchant picks a plan and a number of months. The amount is always worked out here, never taken from the browser. */
export async function createOrder(merchantId: string, input: CreateOrderInput): Promise<CreateOrderResponse> {
  const { id, secret } = keys();
  const amount = planAmount(input.plan, input.months) * 100; // paise
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: `ob_${new mongoose.Types.ObjectId().toHexString()}`,
      notes: { merchantId, plan: input.plan, months: String(input.months) },
    }),
  });
  if (!res.ok) throw new HttpError(502, 'PAYMENT_GATEWAY_ERROR', 'Could not start the payment. Please try again.');
  const order = (await res.json()) as { id: string };
  await Payment.create({ merchantId, plan: input.plan, months: input.months, amount, razorpayOrderId: order.id });
  return {
    orderId: order.id,
    keyId: id,
    amount,
    currency: 'INR',
    plan: input.plan,
    months: input.months,
    description: `${MERCHANT_PLANS[input.plan].name} plan, ${input.months} month${input.months > 1 ? 's' : ''}`,
  };
}

/**
 * Marks the order paid and extends the plan, exactly once. Called by both the browser confirmation and the webhook:
 * whichever arrives second finds the payment already applied and changes nothing.
 */
export async function applyPayment(orderId: string, paymentId: string, paidPaise?: number): Promise<VerifyPaymentResponse> {
  const claimed = await Payment.findOneAndUpdate({ razorpayOrderId: orderId, status: 'created' }, { status: 'processing', razorpayPaymentId: paymentId });
  if (!claimed) {
    const done = await Payment.findOne({ razorpayOrderId: orderId });
    if (!done) throw notFound('Order not found');
    if (done.status === 'paid') return { paidUntil: (await paidUntilOf(String(done.merchantId))) ?? new Date().toISOString(), plan: done.plan, months: done.months, amount: done.amount / 100 };
    // another request is applying it right now
    throw new HttpError(409, 'PAYMENT_IN_PROGRESS', 'Your payment is being confirmed. Refresh in a moment.');
  }
  if (paidPaise !== undefined && paidPaise !== claimed.amount) {
    await Payment.updateOne({ _id: claimed._id }, { status: 'created', $unset: { razorpayPaymentId: 1 } });
    throw badRequest('The amount paid does not match the order', 'AMOUNT_MISMATCH');
  }
  try {
    const r = await extendSubscription(String(claimed.merchantId), claimed.months, claimed.plan, paymentId);
    await Payment.updateOne({ _id: claimed._id }, { status: 'paid', paidAt: new Date() });
    return { paidUntil: r.paidUntil, plan: claimed.plan, months: claimed.months, amount: claimed.amount / 100 };
  } catch (e) {
    // let a retry (the browser, or Razorpay's webhook) try again
    await Payment.updateOne({ _id: claimed._id }, { status: 'created', $unset: { razorpayPaymentId: 1 } });
    throw e;
  }
}

async function paidUntilOf(merchantId: string): Promise<string | undefined> {
  return (await Subscription.findOne({ merchantId }))?.paidUntil.toISOString();
}

/** Step 2: Razorpay checkout returns an order id, payment id and signature in the browser. The signature proves it is real. */
export async function verifyAndApply(merchantId: string, b: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const { secret } = keys();
  const expected = hmac(secret, `${b.razorpay_order_id}|${b.razorpay_payment_id}`);
  if (!safeEqual(expected, b.razorpay_signature)) throw badRequest('Payment could not be verified', 'BAD_SIGNATURE');
  const order = await Payment.findOne({ razorpayOrderId: b.razorpay_order_id });
  if (!order) throw notFound('Order not found');
  if (String(order.merchantId) !== merchantId) throw forbidden();
  return applyPayment(b.razorpay_order_id, b.razorpay_payment_id);
}

/** Razorpay calls this itself, so a paid order still activates the plan if the merchant closes the tab. */
export async function handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  const secret = env().RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, 'PAYMENTS_NOT_CONFIGURED', 'Webhook is not configured');
  if (!signature || !safeEqual(hmac(secret, rawBody), signature)) throw new HttpError(400, 'BAD_SIGNATURE', 'Bad signature');
  const event = JSON.parse(rawBody.toString('utf8')) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } };
  };
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') return;
  const p = event.payload?.payment?.entity;
  if (!p?.id || !p.order_id) return;
  try {
    await applyPayment(p.order_id, p.id, p.amount);
  } catch (e) {
    // an order we did not create, or one already being applied: nothing to do, and Razorpay should not keep retrying
    if (e instanceof HttpError && ['NOT_FOUND', 'PAYMENT_IN_PROGRESS'].includes(e.code)) return;
    throw e;
  }
}
