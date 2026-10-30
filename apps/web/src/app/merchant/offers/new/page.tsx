'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, offerInputSchema, type DiscountType } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { Select } from '@/components/Select';
import { OfferPreview } from '@/components/OfferPreview';
import { OfferaMark } from '@/components/agent/OfferaMark';
import { AreaPicker } from '@/components/maps/AreaPicker';
import type { LocationInput } from '@offerbuzz/shared';
import { ApiRequestError, createOffer, rewriteDescription, updateProfile, uploadOfferImage } from '@/lib/api';
import { shrinkImage } from '@/lib/image';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewOfferPage() {
  const router = useRouter();
  const { user, setUser } = useAccount();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: user.category ?? '',
    discountType: 'percent' as DiscountType,
    discountValue: '',
    startsAt: today(),
    endsAt: '',
    area: user.city ?? '',
    terms: '',
  });
  const [photo, setPhoto] = useState<Blob>();
  const [photoUrl, setPhotoUrl] = useState<string>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [postedNoPhoto, setPostedNoPhoto] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // free the preview image when it is replaced or the page closes
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  async function pick(file?: File) {
    if (!file) return;
    setPhotoError(undefined);
    setPhotoBusy(true);
    try {
      const small = await shrinkImage(file);
      setPhoto(small);
      setPhotoUrl(URL.createObjectURL(small));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not use that photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto() {
    setPhoto(undefined);
    setPhotoUrl(undefined);
    setPhotoError(undefined);
    if (fileRef.current) fileRef.current.value = '';
  }

  // the category can be chosen right here the first time; the location still comes from the profile
  // exact spot for directions: chosen here, else the shop pin from the profile
  const [spot, setSpot] = useState<LocationInput>();
  const needsLocation = !user.location && !spot;

  // AI rewrite of the description: shown as a suggestion the vendor accepts or ignores
  const [rewriting, setRewriting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ text: string; source: 'ai' | 'basic'; note?: 'no_key' | 'unavailable' }>();
  const [rewriteError, setRewriteError] = useState('');
  async function rewrite() {
    setRewriteError('');
    setRewriting(true);
    try {
      const res = await rewriteDescription({
        title: form.title || undefined,
        category: (user.category ?? (form.category || undefined)) as (typeof CATEGORIES)[number] | undefined,
        description: form.description,
      });
      setSuggestion({ text: res.description, source: res.source, note: res.note });
    } catch (err) {
      setRewriteError(err instanceof ApiRequestError ? err.message : 'Could not rewrite right now. Please try again.');
    } finally {
      setRewriting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const parsed = offerInputSchema.safeParse({
      ...form,
      discountValue: form.discountType === 'deal' || form.discountValue === '' ? undefined : form.discountValue,
      terms: form.terms || undefined,
      location: spot,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form');
    setBusy(true);
    try {
      if (!user.category) {
        // first offer: save the chosen category to the shop first (it is locked afterwards)
        const saved = await updateProfile({ category: parsed.data.category });
        setUser({ ...user, ...saved.user });
      }
      const { offer } = await createOffer(parsed.data);
      if (photo) {
        try {
          await uploadOfferImage(offer.id, photo);
        } catch {
          // the offer exists; do not let the vendor post it twice just because the photo failed
          setPostedNoPhoto(true);
          setBusy(false);
          return;
        }
      }
      router.push('/merchant/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'SESSION_EXPIRED') return router.replace('/login');
      setError(err instanceof ApiRequestError ? err.message : 'Could not post the offer, please try again');
      setBusy(false);
    }
  }

  if (postedNoPhoto) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="surface space-y-3 p-6">
          <h1 className="text-section font-bold">Your offer was posted</h1>
          <p className="text-muted">But the photo could not be uploaded. You can delete the offer from your dashboard and post it again with a smaller photo.</p>
          <Link href="/merchant/dashboard" className="btn-primary">Go to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-title font-bold">Post an offer</h1>
      <p className="mt-1 text-muted">New offers are reviewed by our team before customers can see them.</p>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="surface space-y-4 p-4 md:p-6" noValidate>
          {needsLocation && (
            <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
              Before you can post, share this offer&apos;s location below (&quot;Use my current location&quot;), or save your shop location in your{' '}
              <Link href="/merchant/profile" className="font-semibold underline">profile</Link>.
            </p>
          )}
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-title">Offer title</label>
            <input id="o-title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)}
              maxLength={100} placeholder="Flat 30% off on all haircuts" />
          </div>

          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-desc">Description</label>
            <textarea id="o-desc" className="input h-28 py-2" value={form.description} maxLength={600}
              onChange={(e) => set('description', e.target.value)} placeholder="What do customers get, and what should they do to claim it?" />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void rewrite()}
                disabled={rewriting || form.description.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-small font-bold text-purple-800 transition hover:bg-purple-100 active:scale-95 disabled:opacity-50"
              >
                <OfferaMark size={20} />
                {rewriting ? 'Rewriting...' : 'Rewrite with AI'}
              </button>
              <span className="text-small text-muted">{form.description.length}/600</span>
            </div>
            {form.description.trim().length < 10 && <p className="mt-1 text-small text-muted">Write a few words about the offer, then let AI polish them.</p>}
            {rewriteError && <p role="alert" className="mt-1 text-small text-danger">{rewriteError}</p>}
            {suggestion && (
              <div className="ob-fade-up mt-2 rounded-xl border border-purple-200 bg-purple-50 p-3">
                <p className="text-small font-bold text-purple-800">{suggestion.source === 'ai' ? 'Suggested by Offera AI' : suggestion.note === 'no_key' ? 'Only tidied up: AI is not switched on yet' : 'Only tidied up: AI is busy right now, try again in a minute'}</p>
                <p className="mt-1 whitespace-pre-line text-body">{suggestion.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary btn-sm" onClick={() => { set('description', suggestion.text); setSuggestion(undefined); }}>
                    Use this
                  </button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => void rewrite()} disabled={rewriting}>
                    {rewriting ? 'Rewriting...' : 'Try again'}
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setSuggestion(undefined)}>Keep mine</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="mb-1 block text-small font-semibold" id="o-photo-label">
              Photo <span className="font-normal text-muted">(optional, JPEG, PNG or WebP)</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} id="o-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                aria-labelledby="o-photo-label" onChange={(e) => void pick(e.target.files?.[0])} />
              <label htmlFor="o-photo" className="btn-outline cursor-pointer">
                {photoBusy ? 'Preparing...' : photo ? 'Change photo' : 'Choose photo'}
              </label>
              {photo && (
                <>
                  <span className="text-small text-muted">{Math.round(photo.size / 1024)} KB, ready</span>
                  <button type="button" className="text-small font-semibold text-danger underline" onClick={removePhoto}>Remove</button>
                </>
              )}
            </div>
            {photoError && <p role="alert" className="mt-1 text-small text-danger">{photoError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-cat">Category</label>
            {user.category ? (
              <>
                <input id="o-cat" className="input bg-purple-50" value={user.category} readOnly />
                <p className="mt-1 text-small text-muted">Your shop posts offers in this category only.</p>
              </>
            ) : (
              <>
                <Select
                  id="o-cat"
                  value={form.category}
                  onChange={(v) => set('category', v)}
                  placeholder="Choose your shop category"
                  options={CATEGORIES.map((c) => ({ value: c as string, label: c }))}
                />
                <p className="mt-1 text-small text-muted">All your offers go in this category. It is locked after your first offer, so choose carefully.</p>
              </>
            )}
          </div>

          <fieldset>
            <legend className="mb-1 block text-small font-semibold">Discount</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                ariaLabel="Discount type"
                value={form.discountType}
                onChange={(v) => set('discountType', v)}
                options={[
                  { value: 'percent' as DiscountType, label: 'Percent off (%)' },
                  { value: 'amount' as DiscountType, label: 'Amount off (Rs)' },
                  { value: 'deal' as DiscountType, label: 'Special deal (Buy 1 Get 1, free gift...)' },
                ]}
              />
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
            <AreaPicker id="o-area" value={form.area} onChange={(v) => set('area', v)} shopAddress={user.location?.address} onPlace={setSpot} />
            <p className="mt-2 flex items-start gap-1.5 text-small text-muted">
              {spot ? (
                <>
                  <span className="font-semibold text-green-700">Exact location saved.</span> Customers will get directions to this spot
                  ({spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}).
                </>
              ) : user.location ? (
                'Customers will get directions to your shop location. To use a different spot (another branch), tap "Use my current location" while you are there.'
              ) : (
                'Tap "Use my current location" so customers can get directions to this offer.'
              )}
            </p>
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
            <button className="btn-primary" disabled={busy || photoBusy}>{busy ? 'Posting...' : 'Post offer'}</button>
            <Link href="/merchant/dashboard" className="btn-outline">Cancel</Link>
          </div>
        </form>

        <aside className="lg:sticky lg:top-24" aria-label="Preview">
          <p className="mb-2 text-small font-semibold text-muted">Preview: how customers will see your offer</p>
          <OfferPreview d={{ ...form, shop: user.shopName || user.name || '', imageSrc: photoUrl }} />
        </aside>
      </div>
    </div>
  );
}
