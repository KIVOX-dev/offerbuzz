import type { CreateOrderResponse } from '@offerbuzz/shared';

type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void };

let loading: Promise<void> | undefined;

/** Loads Razorpay's checkout script once. */
function loadCheckout(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in a browser'));
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = undefined;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.body.appendChild(s);
  });
  return loading;
}

/**
 * Opens Razorpay checkout for an order made by the API. Resolves with the payment details to verify on the server,
 * or with undefined when the merchant closes the window without paying. Rejects when the payment fails.
 */
export async function openCheckout(order: CreateOrderResponse, prefill: { name?: string; email?: string; contact?: string }): Promise<CheckoutResponse | undefined> {
  await loadCheckout();
  const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'OfferBuzz',
      description: order.description,
      prefill,
      theme: { color: '#4F2F96' },
      handler: (r: CheckoutResponse) => resolve(r),
      modal: { ondismiss: () => resolve(undefined) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r.error?.description || 'The payment failed. You have not been charged, or the amount will be refunded.')));
    rzp.open();
  });
}
