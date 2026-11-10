type Block = { title: string; terms: string[]; note: string[]; footer?: string };

/** Short Terms & Conditions shown at the bottom of each module. The full legal text lives on /terms. */
export const MODULE_TERMS = {
  wallet: {
    title: 'Referral Wallet – Terms & Conditions',
    terms: [
      'Referral wallet rewards can be redeemed only after the referred user successfully registers and completes the required qualifying activity.',
      "Referral rewards will be credited to the referrer's wallet after successful verification.",
      'The minimum wallet balance required for redemption is ₹100.',
      'Wallet balance can be redeemed only through the withdrawal or redemption options provided by OfferBuzz.',
      'Users must provide valid bank account or UPI details to receive the redeemed amount.',
      "Referral rewards cannot be transferred to another user's account or exchanged for cash outside the approved redemption process.",
      'Self-referrals, duplicate accounts, fake registrations, fraudulent activities, or misuse of the referral programme are strictly prohibited.',
      'OfferBuzz reserves the right to withhold, cancel, or reverse referral rewards obtained through fraudulent or suspicious activities.',
      "Referral wallet amounts cannot be redeemed if the user's account is suspended, blocked, or found violating OfferBuzz policies.",
      'Redemption requests will be processed within the timeframe specified by OfferBuzz, subject to verification.',
      'By participating in the referral programme, users agree to these Terms & Conditions.',
    ],
    note: [
      'Minimum redemption: ₹100',
      'Payment method: UPI / Bank Transfer',
      'Referral reward: Credit only after successful verification.',
      'Processing time: 3–7 working days',
    ],
  },
  qr: {
    title: 'Referral QR Code – Terms & Conditions',
    terms: [
      'Your referral QR code and link are unique to you and are meant only for inviting shops to join OfferBuzz.',
      'The QR code must not be edited, redirected to another destination, or used to mislead or deceive anyone.',
      'A reward is earned only when a shop signs up using your code and pays for its plan.',
      'Scanning your own code, or signing up shops you own or control, is treated as a self-referral and is not rewarded.',
      'Do not share the code through spam, unsolicited bulk messages, or false claims about OfferBuzz or its rewards.',
      'OfferBuzz may disable a referral code or withhold rewards if it is misused or breaks OfferBuzz policies.',
      'By sharing your referral code, you agree to these Terms & Conditions.',
    ],
    note: [
      'Reward: Credit only after the referred shop signs up and pays.',
      'The code stays the same for your account.',
      'Misuse of the code can lead to rewards being cancelled.',
    ],
  },
  shops: {
    title: 'Referred Shops – Terms & Conditions',
    terms: [
      'Only shops that sign up with your referral code appear in this list.',
      'A shop is counted as your referral only when it registers successfully with your code. The referrer cannot be changed after sign up.',
      'Shops that are fake, duplicate, inactive, or owned by you or your family do not qualify for rewards.',
      'Rewards for a shop are credited only when that shop pays for its plan, and stop if its plan ends or the shop is blocked.',
      'OfferBuzz may remove a shop from your list, and cancel related rewards, after finding fraud or a policy violation.',
      'You must not share a shop’s details outside OfferBuzz or contact its customers without permission.',
    ],
    note: [
      'Reward: Credit only after the shop pays its plan.',
      'Shops are verified by OfferBuzz before rewards are credited.',
    ],
  },
  vendorOffer: {
    title: 'Posting Offers – Terms & Conditions',
    terms: [
      'Every offer must be genuine, and you must honour it at the stated price or discount, in the stated area, for its whole period.',
      'Titles, descriptions, dates, discounts and photos must be accurate and not misleading. Do not advertise stock you do not have or inflate original prices.',
      'You must have the right to use every photo and piece of text you upload.',
      'All offers are listed under the shop category chosen at sign up. Offers in any other category are not accepted.',
      'New offers are reviewed by OfferBuzz before they appear to customers. OfferBuzz may approve, reject, edit or remove any offer.',
      'An offer stops showing after its end date. Reminder emails are a courtesy only; you are responsible for tracking your offer dates.',
      'Offers for prohibited, illegal, counterfeit or unlicensed goods and services are not allowed.',
      'You are solely responsible for delivering the offer and for handling refunds, complaints and disputes with your customers.',
      'By posting an offer, you agree to these Terms & Conditions.',
    ],
    note: [
      'Review: Offers go live after approval by OfferBuzz.',
      'Posting needs an active paid plan.',
      'Offers are hidden after their end date.',
    ],
  },
  vendorPlan: {
    title: 'Merchant Plan – Terms & Conditions',
    terms: [
      'Posting offers requires an active paid plan, billed monthly: Basic Rs 149, Premium Rs 349 or Featured Rs 599 per month. Paying for 6 or 12 months at once is 10% cheaper.',
      'Your offers stay visible until the plan’s paid-until date, plus a short grace period.',
      'If the plan is not renewed by the end of the grace period, your offers are hidden until you pay again.',
      'Payments are recorded against your account once OfferBuzz receives them.',
      'Plan fees are generally non-refundable once the month has started, except where the law requires or OfferBuzz agrees in writing (for example, a duplicate payment).',
      'OfferBuzz may change the price or plans, and the change applies from the next billing period after notice.',
      'Accounts that are suspended or blocked for breaking OfferBuzz policies are not entitled to a refund.',
      'By using the merchant plan, you agree to these Terms & Conditions.',
    ],
    note: [
      'Billing: Monthly',
      'Grace period after the paid-until date: 3 days',
      'Offers are hidden once the grace period ends.',
    ],
  },
  customer: {
    title: 'Offers – Terms & Conditions',
    terms: [
      'Offers are created and run by the shops (merchants). OfferBuzz only lists them and does not sell, supply or deliver any goods or services.',
      'Prices, availability, quality and after-sales service are the shop’s responsibility. Please confirm details with the shop before you buy.',
      'An offer may end early or change if the shop withdraws it or runs out of stock.',
      'Offers are valid only for the dates, area and conditions shown on the offer.',
      'If an offer is not honoured, raise it with the shop first. You can also report it to OfferBuzz so the shop can be reviewed.',
      'By using OfferBuzz to view or save offers, you agree to these Terms & Conditions.',
    ],
    note: [
      'Offers are valid only until the end date shown.',
      'OfferBuzz is a listing platform and is not a party to any purchase.',
    ],
  },
} satisfies Record<string, Block>;

export type ModuleTermsKey = keyof typeof MODULE_TERMS;

/** Collapsible Terms & Conditions block with the NOTE list, for the bottom of a module page. */
export function ModuleTerms({ id, defaultOpen = false }: { id: ModuleTermsKey; defaultOpen?: boolean }) {
  const t: Block = MODULE_TERMS[id];
  return (
    <section aria-label={t.title} className="surface p-4">
      <details open={defaultOpen}>
        <summary className="cursor-pointer text-body font-bold">{t.title}</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-small text-ink/80">
          {t.terms.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </details>
      <div className="mt-4 rounded-md bg-purple-50 p-3">
        <p className="text-small font-bold uppercase tracking-wide text-purple-900">Note</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-small text-ink/80">
          {t.note.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
