import { layout, type EmailBlock } from './layout';
import { BLACK_FRIDAY_HTML } from './blackFriday';

export interface EmailTemplate {
  /** File name and key. */
  id: string;
  /** Email subject (may use placeholders). */
  subject: string;
  /** Every {{ params.x }} the body uses. */
  params: string[];
  kind: 'transactional' | 'marketing';
  /** Phase the template is first needed in. */
  phase: number;
  /** Standard layout content. Omit when `html` is given. */
  block?: EmailBlock;
  /** Full custom HTML (campaigns with their own design). */
  html?: string;
  /** Marketing only: fixed values for a Brevo Campaign, where {{ params.x }} is not filled in. */
  campaignDefaults?: Record<string, string>;
}


const t = (
  id: string,
  phase: number,
  subject: string,
  params: string[],
  block: EmailBlock,
  kind: EmailTemplate['kind'] = 'transactional',
): EmailTemplate => ({ id, phase, subject, params, kind, block: { ...block, marketing: kind === 'marketing' } });

export const TEMPLATES: EmailTemplate[] = [
  // ---- Phase 1: login ----
  t('login-code', 1, 'Your OfferBuzz login code', ['code', 'minutes'], {
    preheader: 'Your code is {{ params.code }}. It expires in {{ params.minutes }} minutes.',
    heading: 'Your login code',
    paragraphs: ['Use this code to continue to OfferBuzz. It is valid for {{ params.minutes }} minutes and works only once.'],
    highlight: '{{ params.code }}',
    note: 'If you did not ask for this code, you can safely ignore this email. Never share it with anyone.',
  }),

  // ---- Phases 3-4: vendors ----
  t('shop-approved', 3, 'Your shop is approved on OfferBuzz', ['name', 'shopName', 'url'], {
    preheader: '{{ params.shopName }} is approved. Start the plan and post your first offer.',
    heading: 'Your shop is approved',
    paragraphs: [
      'Hi {{ params.name }},',
      'Good news: <b>{{ params.shopName }}</b> has been approved. Activate your monthly plan to start posting offers to customers near you.',
    ],
    cta: { label: 'Go to my dashboard', url: '{{ params.url }}' },
  }),
  t('shop-rejected', 3, 'Update on your OfferBuzz shop registration', ['name', 'shopName', 'reason', 'url'], {
    preheader: 'We could not approve {{ params.shopName }} yet.',
    heading: 'We could not approve your shop yet',
    paragraphs: [
      'Hi {{ params.name }},',
      'We reviewed <b>{{ params.shopName }}</b> and could not approve it yet.',
      '<b>Reason:</b> {{ params.reason }}',
      'You can update your shop details and submit again.',
    ],
    cta: { label: 'Update my shop', url: '{{ params.url }}' },
  }),
  t('offer-approved', 3, 'Your offer is live: {{ params.offerTitle }}', ['name', 'offerTitle', 'url'], {
    preheader: '{{ params.offerTitle }} is now visible to customers.',
    heading: 'Your offer is live',
    paragraphs: ['Hi {{ params.name }},', '<b>{{ params.offerTitle }}</b> has been approved and is now visible to customers.'],
    cta: { label: 'View my offer', url: '{{ params.url }}' },
  }),
  t('offer-rejected', 3, 'Your offer needs changes: {{ params.offerTitle }}', ['name', 'offerTitle', 'reason', 'url'], {
    preheader: '{{ params.offerTitle }} was not approved.',
    heading: 'Your offer needs changes',
    paragraphs: [
      'Hi {{ params.name }},',
      '<b>{{ params.offerTitle }}</b> was not approved.',
      '<b>Reason:</b> {{ params.reason }}',
    ],
    cta: { label: 'Edit my offer', url: '{{ params.url }}' },
  }),
  t('offer-expiring', 3, 'Your offer ends {{ params.when }}: {{ params.offerTitle }}', ['name', 'offerTitle', 'endDate', 'when', 'url'], {
    preheader: '{{ params.offerTitle }} ends {{ params.when }}.',
    heading: 'Your offer is ending soon',
    paragraphs: [
      'Hi {{ params.name }},',
      '<b>{{ params.offerTitle }}</b> ends <b>{{ params.when }}</b> ({{ params.endDate }}). After that it will no longer be shown to customers.',
      'Want to keep the deal going? Post a new offer with fresh dates from your dashboard.',
    ],
    cta: { label: 'Go to my dashboard', url: '{{ params.url }}' },
  }),
  t('plan-receipt', 4, 'Payment received: OfferBuzz plan', ['name', 'amount', 'periodStart', 'periodEnd', 'paymentId'], {
    preheader: 'We received Rs {{ params.amount }} for your OfferBuzz plan.',
    heading: 'Payment received',
    paragraphs: [
      'Hi {{ params.name }},',
      'Thank you. We received <b>Rs {{ params.amount }}</b> for your OfferBuzz plan.',
      'Plan period: <b>{{ params.periodStart }}</b> to <b>{{ params.periodEnd }}</b><br>Payment ID: {{ params.paymentId }}',
    ],
    note: 'Keep this email as your receipt.',
  }),
  t('plan-renewal-failed', 4, 'Action needed: your OfferBuzz renewal failed', ['name', 'graceDays', 'url'], {
    preheader: 'Fix your payment within {{ params.graceDays }} days to keep your offers visible.',
    heading: 'Your renewal payment failed',
    paragraphs: [
      'Hi {{ params.name }},',
      'We could not charge your plan renewal. Please update your payment method within <b>{{ params.graceDays }} days</b>, otherwise your offers will be hidden from customers.',
    ],
    cta: { label: 'Fix my payment', url: '{{ params.url }}' },
  }),
  t('plan-expiring', 4, 'Your OfferBuzz plan renews on {{ params.renewalDate }}', ['name', 'renewalDate', 'url'], {
    preheader: 'Your plan renews on {{ params.renewalDate }}.',
    heading: 'Your plan renews soon',
    paragraphs: ['Hi {{ params.name }},', 'Your plan renews on <b>{{ params.renewalDate }}</b>. Make sure your payment method is up to date.'],
    cta: { label: 'Manage my plan', url: '{{ params.url }}' },
  }),
  t('plan-lapsed', 4, 'Your offers are hidden: plan expired', ['name', 'url'], {
    preheader: 'Renew your plan to show your offers to customers again.',
    heading: 'Your plan has expired',
    paragraphs: [
      'Hi {{ params.name }},',
      'Your plan has expired, so your offers are no longer visible to customers. Renew any time to switch them back on.',
    ],
    cta: { label: 'Renew my plan', url: '{{ params.url }}' },
  }),

  // ---- Phases 5-6: intermediaries ----
  t('intermediary-approved', 5, 'You are approved as an OfferBuzz intermediary', ['name', 'url'], {
    preheader: 'Your QR code and wallet are active.',
    heading: 'You are approved',
    paragraphs: [
      'Hi {{ params.name }},',
      'Your intermediary account is approved. Your personal QR code and wallet are now active. Share your QR with shops to earn credits on every paid month.',
    ],
    cta: { label: 'Open my dashboard', url: '{{ params.url }}' },
  }),
  t('intermediary-rejected', 5, 'Update on your OfferBuzz intermediary application', ['name', 'reason'], {
    preheader: 'We could not approve your application yet.',
    heading: 'We could not approve your application yet',
    paragraphs: ['Hi {{ params.name }},', 'We reviewed your application and could not approve it yet.', '<b>Reason:</b> {{ params.reason }}'],
  }),
  t('referral-paid', 5, 'A shop you referred just paid', ['name', 'shopName', 'credits', 'availableOn', 'url'], {
    preheader: '{{ params.credits }} credits added to your wallet (pending).',
    heading: 'You earned {{ params.credits }} credits',
    paragraphs: [
      'Hi {{ params.name }},',
      '<b>{{ params.shopName }}</b> paid for another month. <b>{{ params.credits }} credits</b> were added to your wallet as pending.',
      'They become available on <b>{{ params.availableOn }}</b>.',
    ],
    cta: { label: 'View my wallet', url: '{{ params.url }}' },
  }),
  t('payout-paid', 6, 'Your OfferBuzz payout of Rs {{ params.amount }} was sent', ['name', 'amount', 'utr', 'url'], {
    preheader: 'Rs {{ params.amount }} sent. Please confirm you received it.',
    heading: 'Your payout was sent',
    paragraphs: [
      'Hi {{ params.name }},',
      'We paid <b>Rs {{ params.amount }}</b> to your UPI ID.<br>Transaction ID (UTR): <b>{{ params.utr }}</b>',
      'Please confirm that you received it. If you did not, report it and we will look into it.',
    ],
    cta: { label: 'Confirm or report', url: '{{ params.url }}' },
  }),

  // ---- Internal ----
  t('admin-alert', 3, 'OfferBuzz admin: {{ params.what }}', ['what', 'details', 'url'], {
    preheader: '{{ params.what }}',
    heading: '{{ params.what }}',
    paragraphs: ['{{ params.details }}'],
    cta: { label: 'Open admin panel', url: '{{ params.url }}' },
  }),

  // ---- Phase 7: marketing ----
  {
    id: 'black-friday',
    phase: 7,
    kind: 'marketing',
    subject: 'Black Friday: up to {{ params.discount }}% off on OfferBuzz',
    params: ['discount', 'url'],
    html: BLACK_FRIDAY_HTML,
    campaignDefaults: { discount: '60', url: 'https://offerbuzz.vercel.app' },
  },
  t(
    'deals-digest',
    7,
    'New deals near you in {{ params.city }}',
    ['name', 'city', 'dealsHtml', 'url'],
    {
      preheader: 'Fresh offers from shops in {{ params.city }}.',
      heading: 'New deals near you',
      paragraphs: ['Hi {{ params.name }},', 'Here are today\'s offers from shops in <b>{{ params.city }}</b>.', '{{ params.dealsHtml }}'],
      cta: { label: 'See all offers', url: '{{ params.url }}' },
    },
    'marketing',
  ),
  t(
    'announcement',
    7,
    '{{ params.title }}',
    ['title', 'body', 'url', 'ctaLabel'],
    {
      preheader: '{{ params.title }}',
      heading: '{{ params.title }}',
      paragraphs: ['{{ params.body }}'],
      cta: { label: '{{ params.ctaLabel }}', url: '{{ params.url }}' },
    },
    'marketing',
  ),
];

export const templateById = (id: string): EmailTemplate => {
  const found = TEMPLATES.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown email template: ${id}`);
  return found;
};

/** Raw HTML with {{ params.x }} placeholders still in place (what gets pasted into Brevo). */
export const rawHtml = (tpl: EmailTemplate): string => tpl.html ?? layout(tpl.subject, tpl.block as EmailBlock);

/** Campaign-ready HTML: params replaced by fixed defaults, Brevo's {{ unsubscribe }} left in place. */
export const campaignHtml = (tpl: EmailTemplate): string | null =>
  tpl.campaignDefaults ? fill(rawHtml(tpl), tpl.campaignDefaults, true) : null;

/** Params whose value is trusted HTML built by our own code, not user input. */
const HTML_PARAMS = new Set(['dealsHtml']);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fill = (text: string, params: Record<string, string>, html: boolean) =>
  text.replace(/\{\{\s*params\.(\w+)\s*\}\}/g, (_m, key: string) => {
    const v = params[key] ?? '';
    return html && !HTML_PARAMS.has(key) ? escapeHtml(v) : v;
  });

/** Renders a template for sending through the API. User supplied values are HTML escaped. */
export function renderEmail(id: string, params: Record<string, string>): { subject: string; html: string } {
  const tpl = templateById(id);
  const missing = tpl.params.filter((k) => params[k] === undefined);
  if (missing.length) throw new Error(`Email "${id}" is missing params: ${missing.join(', ')}`);
  return { subject: fill(tpl.subject, params, false), html: fill(rawHtml(tpl), params, true) };
}

