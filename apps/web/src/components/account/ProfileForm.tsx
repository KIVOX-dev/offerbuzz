'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, type LocationInput } from '@offerbuzz/shared';
import { ApiRequestError, updateProfile } from '@/lib/api';
import { LocationPicker } from '../maps/LocationPicker';
import { Select } from '../Select';
import { useAccount } from './AccountShell';

/** Edit your own details. Email is shown but cannot be changed here. */
export function ProfileForm({ showShop, doneHref }: { showShop?: boolean; /** where to go after the first save completes the profile */ doneHref?: string }) {
  const router = useRouter();
  const { user, setUser } = useAccount();
  // true while the account is new and still needs its details: the first complete save then goes on to the dashboard
  const [wasIncomplete] = useState(() => (showShop ? !user.shopName || !user.location || !user.category : !user.phone || !user.city));
  const [website, setWebsite] = useState(user.website ?? '');
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ? user.phone.replace(/^\+91/, '') : '');
  const [shopName, setShopName] = useState(user.shopName ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [category, setCategory] = useState(user.category ?? '');
  const [location, setLocation] = useState<LocationInput | undefined>(user.location);
  const [locationChanged, setLocationChanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(undefined);
    try {
      const res = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        ...(showShop ? { shopName: shopName.trim(), website: website.trim() } : {}),
        ...(showShop && locationChanged && location ? { location } : {}),
        ...(showShop && !user.category && category ? { category: category as (typeof CATEGORIES)[number] } : {}),
      });
      setUser({ ...user, ...res.user });
      setLocationChanged(false);
      if (res.user.location) setLocation(res.user.location);
      setMsg({ ok: true, text: 'Profile saved' });
      const u = res.user;
      const complete = showShop ? Boolean(u.shopName && u.location && u.category) : Boolean(u.phone && u.city);
      if (wasIncomplete && complete && doneHref) router.push(doneHref);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiRequestError ? err.message : 'Could not save, please try again' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="surface max-w-xl space-y-4 p-4 md:p-6">
      <div>
        <label className="mb-1 block text-small font-semibold" htmlFor="p-email">Email</label>
        <input id="p-email" className="input bg-purple-50" value={user.email ?? ''} readOnly aria-describedby="p-email-note" />
        <p id="p-email-note" className="mt-1 text-small text-muted">Your email is your login and cannot be changed.</p>
      </div>
      <div>
        <label className="mb-1 block text-small font-semibold" htmlFor="p-name">{showShop ? 'Shop owner name' : 'Your name'}</label>
        <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      </div>
      {showShop && (
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="p-shop">Shop name</label>
          <input id="p-shop" className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={80}
            placeholder="Shown on your offers" />
        </div>
      )}
      {showShop && (
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="p-web">Website link <span className="font-normal text-muted">(optional)</span></label>
          <input id="p-web" type="url" inputMode="url" className="input" value={website} onChange={(e) => setWebsite(e.target.value)}
            maxLength={200} placeholder="www.myshop.com" />
          <p className="mt-1 text-small text-muted">Shown next to your store location on your offers.</p>
        </div>
      )}
      {showShop && (
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="p-category">Shop category</label>
          {user.category ? (
            <>
              <input id="p-category" className="input bg-purple-50" value={user.category} readOnly />
              <p className="mt-1 text-small text-muted">Your offers are listed in this category. Contact support to change it.</p>
            </>
          ) : (
            <>
              <Select id="p-category" value={category} onChange={setCategory} placeholder="Choose your category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <p className="mt-1 text-small text-muted">Required before you can post offers. It cannot be changed later.</p>
            </>
          )}
        </div>
      )}
      {showShop && (
        <div>
          <p className="mb-1 text-small font-semibold">Shop location</p>
          <p className="mb-2 text-small text-muted">Save it once here and every offer uses it automatically. You can still pick another place when you post an offer, for example if you are travelling.</p>
          <LocationPicker
            value={location}
            onChange={(loc) => {
              setLocation(loc);
              setLocationChanged(true);
            }}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="p-phone">Mobile number</label>
          <div className="flex">
            <span className="flex items-center rounded-l-md border border-r-0 border-purple-200 bg-purple-50 px-3 text-small text-muted">+91</span>
            <input id="p-phone" className="input rounded-l-none" inputMode="numeric" autoComplete="tel-national" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="10 digit number" maxLength={14} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-small font-semibold" htmlFor="p-city">City</label>
          <input id="p-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60}
            autoComplete="address-level2" placeholder="Coimbatore" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy || name.trim().length < 2}>
          {busy ? 'Saving...' : 'Save changes'}
        </button>
        {msg && (
          <p role="status" className={`text-small ${msg.ok ? 'text-green-700' : 'text-danger'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}
