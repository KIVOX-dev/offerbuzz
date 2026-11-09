'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, offerInputSchema, type DiscountType } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { Select } from '@/components/Select';
import { OfferPreview } from '@/components/OfferPreview';
import { OfferaMark } from '@/components/agent/OfferaMark';
import { AreaPicker, areaFromCoords } from '@/components/maps/AreaPicker';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { LocationInput } from '@offerbuzz/shared';
import { ApiRequestError, createOffer, rewriteDescription, updateProfile, uploadOfferImage } from '@/lib/api';
import { shrinkImage } from '@/lib/image';
import { ModuleTerms } from '@/components/ModuleTerms';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewOfferPage() {
  const router = useRouter();
  const { user, setUser } = useAccount();
  const [form, setForm] = useState({
    shopName: user.shopName ?? '',
    ownerName: user.name ?? '',
    website: user.website ?? '',
    title: '',
    description: '',
    category: user.category ?? '',
    discountType: 'percent' as DiscountType,
    discountValue: '',
    startsAt: today(),
    endsAt: '',
    area: (user.location?.address ?? user.city ?? '').replace(/,\s*India$/i, ''),
    phone: user.phone?.replace(/^\+91/, '') ?? '',
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
  // Where the offer is redeemed. Default: the shop location saved in the profile. Otherwise somewhere else (another
  // branch, or a merchant who is out of town): typed by hand, auto-detected, or pinned on the map.
  const [where, setWhere] = useState<'shop' | 'other'>(user.location ? 'shop' : 'other');
  const [spot, setSpot] = useState<LocationInput>();
  const [showMap, setShowMap] = useState(false);
  const shopArea = (user.location?.address ?? user.city ?? '').replace(/,\s*India$/i, '');
  function chooseWhere(w: 'shop' | 'other') {
    setWhere(w);
    setSpot(undefined);
    set('area', w === 'shop' ? shopArea : '');
  }
  // a pin placed on the map: remember the point and fill the area name from it
  async function pinned(loc: LocationInput) {
    setSpot(loc);
    const name = await areaFromCoords(loc.lat, loc.lng).catch(() => undefined);
    if (name) set('area', name);
  }
  // sent with the offer: the saved shop pin, or the exact point chosen (none = the server looks up the typed area)
  const offerSpot: LocationInput | undefined = where === 'shop' ? user.location : spot;

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
      location: offerSpot,
    });
    if (form.shopName.trim().length < 2) return setError('Enter your shop name');
    if (form.ownerName.trim().length < 2) return setError('Enter the shop owner name');
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form');
    setBusy(true);
    try {
      // shop details live on the profile: save them (and the category) when they changed
      const changes = {
        ...(form.shopName.trim() !== (user.shopName ?? '') ? { shopName: form.shopName.trim() } : {}),
        ...(form.ownerName.trim() !== (user.name ?? '') ? { name: form.ownerName.trim() } : {}),
        ...(form.website.trim() !== (user.website ?? '') ? { website: form.website.trim() } : {}),
        ...(!user.category ? { category: parsed.data.category } : {}),
      };
      if (Object.keys(changes).length) {
        const saved = await updateProfile(changes);
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="o-shop">Shop name</label>
              <input id="o-shop" className="input" value={form.shopName} onChange={(e) => set('shopName', e.target.value)}
                maxLength={80} autoComplete="organization" placeholder="e.g. Sri Murugan Stores" />
            </div>
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="o-owner">Shop owner name</label>
              <input id="o-owner" className="input" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)}
                maxLength={80} autoComplete="name" placeholder="Owner's full name" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-web">
              Website link <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="o-web" type="url" inputMode="url" className="input" value={form.website} onChange={(e) => set('website', e.target.value)}
              maxLength={200} placeholder="www.myshop.com" />
            <p className="mt-1 text-small text-muted">Shown next to your store location on the offer.</p>
          </div>
          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-title">Offer title</label>
            <input id="o-title" className="input uppercase" value={form.title} onChange={(e) => set('title', e.target.value)}
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
                <p className="mt-1 text-small text-muted">All your offers go in this category. You can change it later in your profile.</p>
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

          <fieldset>
            <legend className="mb-1 block text-small font-semibold">Where can customers redeem this offer?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-small ${where === 'shop' ? 'border-purple-600 bg-purple-50' : 'border-purple-200'} ${user.location ? '' : 'cursor-not-allowed opacity-50'}`}>
                <input type="radio" name="where" className="mt-0.5" checked={where === 'shop'} disabled={!user.location} onChange={() => chooseWhere('shop')} />
                <span>
                  <span className="block font-semibold">My shop location</span>
                  <span className="block text-muted">{user.location ? shopArea || 'Saved in your profile' : 'Not saved yet. Add it in your profile.'}</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-small ${where === 'other' ? 'border-purple-600 bg-purple-50' : 'border-purple-200'}`}>
                <input type="radio" name="where" className="mt-0.5" checked={where === 'other'} onChange={() => chooseWhere('other')} />
                <span>
                  <span className="block font-semibold">Another place</span>
                  <span className="block text-muted">A branch, or you are away from the shop (for example posting for Coimbatore from another city).</span>
                </span>
              </label>
            </div>
            {!user.location && (
              <p className="mt-2 text-small text-muted">
                Tip: <Link href="/merchant/profile" className="font-semibold text-purple-700 underline">save your shop location in your profile</Link> once, and it is used automatically.
              </p>
            )}
          </fieldset>

          {where === 'other' && (
            <div>
              <label className="mb-1 block text-small font-semibold" htmlFor="o-area">Area or city</label>
              <AreaPicker id="o-area" value={form.area} onChange={(v) => set('area', v)} shopAddress={user.location?.address} onPlace={setSpot} />
              <button type="button" onClick={() => setShowMap((v) => !v)} className="mt-2 text-small font-semibold text-purple-700 underline">
                {showMap ? 'Hide the map' : 'Or drop a pin on the map'}
              </button>
              {showMap && (
                <div className="mt-2">
                  <LocationPicker value={spot} onChange={(loc) => void pinned(loc)} />
                </div>
              )}
              <p className="mt-2 text-small text-muted">
                {spot ? (
                  <>
                    <span className="font-semibold text-green-700">Exact location saved.</span> Customers will get directions to this spot ({spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}).
                  </>
                ) : (
                  'Type the area, pick a suggestion, auto-detect where you are, or drop a pin. If you only type it, we find the spot from the name.'
                )}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-small font-semibold" htmlFor="o-phone">
              Shop phone number <span className="font-normal text-danger">(required)</span>
            </label>
            <input id="o-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required className="input" maxLength={13}
              value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d+\s-]/g, ''))} placeholder="10 digit mobile number" />
            <p className="mt-1 text-small text-muted">Customers will see this number on your offer so they can call the shop.</p>
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
      <ModuleTerms id="vendorOffer" />
    </div>
  );
}
