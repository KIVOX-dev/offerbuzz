import type { WalletEntryDTO, WalletResponse } from '@offerbuzz/shared';
import { User } from '../../models/User';
import { WalletEntry, type WalletEntryDoc } from '../../models/WalletEntry';
import { getSettings } from '../../models/Setting';

const DAY = 86_400_000;
export const currentPeriod = (d = new Date()) => d.toISOString().slice(0, 7);

/**
 * Called when a referred shop's subscription payment succeeds (the payment webhook, Phase 4).
 * Pays the shop's intermediary the configured commission, held for `holdDays`. Safe to call twice for the
 * same shop and month: the second call changes nothing and returns null. Returns null when the shop has no referrer.
 */
export async function creditReferrerForSubscription(merchantId: string, period = currentPeriod()) {
  const merchant = await User.findById(merchantId).select('referredBy');
  if (!merchant?.referredBy) return null;
  const settings = await getSettings();
  try {
    return await WalletEntry.create({
      intermediaryId: merchant.referredBy,
      merchantId: merchant._id,
      kind: 'credit',
      reason: 'subscription',
      credits: settings.commissionCredits,
      period,
      availableAt: new Date(Date.now() + settings.holdDays * DAY),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  }
}

const toEntryDTO = (e: WalletEntryDoc, shops: Map<string, string>): WalletEntryDTO => ({
  id: String(e._id),
  kind: e.kind,
  reason: e.reason,
  credits: e.credits,
  period: e.period ?? undefined,
  shop: e.merchantId ? shops.get(String(e.merchantId)) : undefined,
  availableAt: e.availableAt.toISOString(),
  createdAt: e.createdAt.toISOString(),
});

export async function getWallet(intermediaryId: string): Promise<WalletResponse> {
  const [entries, settings, referred] = await Promise.all([
    WalletEntry.find({ intermediaryId }).sort({ createdAt: -1 }),
    getSettings(),
    User.find({ referredBy: intermediaryId }).select('name shopName createdAt').sort({ createdAt: -1 }).limit(200),
  ]);
  const now = Date.now();
  let earned = 0;
  let spent = 0;
  let released = 0;
  for (const e of entries) {
    if (e.kind === 'debit') spent += e.credits;
    else {
      earned += e.credits;
      if (e.availableAt.getTime() <= now) released += e.credits;
    }
  }
  const balance = earned - spent;
  const available = Math.max(0, Math.min(balance, released - spent));
  const shops = new Map(referred.map((u) => [String(u._id), u.shopName || u.name || 'Shop']));
  return {
    balance,
    available,
    onHold: balance - available,
    totalEarned: earned,
    payoutThreshold: settings.payoutThreshold,
    holdDays: settings.holdDays,
    commissionCredits: settings.commissionCredits,
    shops: referred.map((u) => ({ id: String(u._id), name: u.shopName || u.name || 'Shop', joinedAt: u.createdAt.toISOString() })),
    entries: entries.slice(0, 50).map((e) => toEntryDTO(e, shops)),
  };
}
