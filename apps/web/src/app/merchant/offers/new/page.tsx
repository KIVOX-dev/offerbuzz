'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CATEGORIES, offerInputSchema, type DiscountType } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { ApiRequestError, createOffer } from '@/lib/api';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewOfferPage() {
  const router = useRouter();
  const { user } = useAccount();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    discountType: 'percent' as DiscountType,
    discountValue: '',
    startsAt: today(),
    endsAt: '',
    area: user.city ?? '',
    terms: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const parsed = offerInputSchema.safeParse({
      ...form,
      discountValue: form.discountType === 'deal' || form.discountValue === '' ? undefined : form.discountValue,
      terms: form.terms || undefined,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form');
    setBusy(true);
    try {
      await createOffer(parsed.data);
      router.push('/merchant/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'SESSION_EXPIRED') return router.replace('/login');
      setError(err instanceof ApiRequestError ? err.message : 'Could not post the offer, please try again');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-title font-bold">Post an offer</h1>
      <p className="mt-1 text-muted">New offers are reviewed by our team before customers can see them.</p>

      <form onSubmit={submit} className="surface mt-4 space-y-4 p-4 md:p-6" noValidate>
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="o-title">Offer title</label>
          <input id="o-title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)}
            maxLength={100} placeholder="Flat 30% off on all haircuts" />
        </div>

        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="o-desc">Description</label>
          <textarea id="o-desc" className="input h-28 py-2" value={form.description} maxLength={600}
            onChange={(e) => set('description', e.target.value)} placeholder="What do customers get, and what should they do to claim it?" />
          <p className="mt-1 text-right text-small text-muted">{form.description.length}/600</p>
        </div>

        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="o-cat">Category</label>
          <select id="o-cat" className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1 block text-small font-semibold">Discount</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Discount type" className="input" value={form.discountType}
              onChange={(e) => set('discountType', e.target.value as DiscountType)}>
              <option value="percent">Percent off (%)</option>
              <option value="amount">Amount off (Rs)</option>
              <option value="deal">Special deal (Buy 1 Get 1, free gift...)</option>
            </select>
            {form.discountType !== 'deal' && (
              <input aria-label="Discount value" className="input" inputMode="decimal" value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value.replace(/[^\d.]/g, ''))}
                placeholder={form.discountType === 'percent' ? 'e.g. 30' : 'e.g. 200'} />
            )}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-start">Starts on</label>
            <input id="o-start" type="date" className="input" value={form.startsAt} min={today()}
              onChange={(e) => set('startsAt', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-end">Ends on</label>
            <input id="o-end" type="date" className="input" value={form.endsAt} min={form.startsAt || today()}
              onChange={(e) => set('endsAt', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="o-area">Area or city</label>
          <input id="o-area" className="input" value={form.area} onChange={(e) => set('area', e.target.value)}
            maxLength={100} placeholder="RS Puram, Coimbatore" />
        </div>

        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="o-terms">
            Terms <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="o-terms" className="input" value={form.terms} onChange={(e) => set('terms', e.target.value)}
            maxLength={300} placeholder="Valid on weekdays only" />
        </div>

        {error && <p role="alert" className="text-small text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? 'Posting...' : 'Post offer'}</button>
          <Link href="/merchant/dashboard" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
