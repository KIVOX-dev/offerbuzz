import { Offer } from '../models/Offer';
import { BRAND } from '../emails/layout';
import { sendTemplateEmail } from './brevo';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Vendors are told this many days before the last day of the offer (and on the last day itself). */
export const NOTICE_DAYS = 2;
const CHECK_EVERY_MS = 60 * 60 * 1000;

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
const startOfDay = (d: Date) => new Date(`${dateOnly(d)}T00:00:00.000Z`);

function whenText(daysLeft: number): string {
  if (daysLeft <= 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  return `in ${daysLeft} days`;
}

/**
 * Emails the vendor of every live offer whose last day is within NOTICE_DAYS. Each offer is noticed once
 * (expiryNoticeSentAt), and a failed send is left unmarked so the next run tries again. Returns how many were sent.
 */
export async function notifyExpiringOffers(now = new Date()): Promise<number> {
  const today = startOfDay(now);
  const offers = await Offer.find({
    status: 'active',
    expiryNoticeSentAt: { $exists: false },
    endsAt: { $gte: today, $lte: new Date(today.getTime() + NOTICE_DAYS * DAY_MS) },
  })
    .populate<{ merchantId: { email?: string; name?: string; shopName?: string } | null }>('merchantId', 'email name shopName')
    .limit(500);

  let sent = 0;
  for (const offer of offers) {
    const vendor = offer.merchantId;
    if (!vendor?.email) continue; // phone-only accounts have no address to write to
    try {
      await sendTemplateEmail(vendor.email, 'offer-expiring', {
        name: vendor.name || vendor.shopName || 'there',
        offerTitle: offer.title,
        endDate: dateOnly(offer.endsAt),
        when: whenText(Math.round((startOfDay(offer.endsAt).getTime() - today.getTime()) / DAY_MS)),
        url: `${BRAND.siteUrl}/merchant/dashboard`,
      });
      await Offer.updateOne({ _id: offer._id }, { expiryNoticeSentAt: new Date() });
      sent++;
    } catch (err) {
      console.error(`Expiry notice for offer ${offer._id} failed:`, (err as Error).message);
    }
  }
  return sent;
}

/** Runs the check shortly after boot and then hourly. The timer never keeps the process alive on its own. */
export function startOfferExpiryJob(): () => void {
  const run = () => notifyExpiringOffers().catch((err) => console.error('Offer expiry check failed:', err.message));
  const first = setTimeout(run, 60_000);
  const every = setInterval(run, CHECK_EVERY_MS);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
