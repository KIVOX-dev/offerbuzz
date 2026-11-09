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
        ...(showShop && category && category !== user.category ? { category: category as (typeof CATEGORIES)[number] } : {}),
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

  const field = 'mb-1 block text-small font-semibold';
  const compact = '!h-10';
  return (
    <form onSubmit={save} className={`surface p-4 md:p-5 ${showShop ? '' : 'max-w-xl'}`}>
      <div className={showShop ? 'grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6' : ''}>
        {/* left: who you are and the shop details, two fields per row so it fits one screen */}
        <div className="grid content-start gap-x-3 gap-y-3 sm:grid-cols-2">
          <div>
            <label className={field} htmlFor="p-email">Email</label>
            <input id="p-email" className={`input bg-purple-50 ${compact}`} value={user.email ?? ''} readOnly title="Your email is your login and cannot be changed" />
          </div>
          <div>
            <label className={field} htmlFor="p-name">{showShop ? 'Shop owner name' : 'Your name'}</label>
            <input id="p-name" className={`input ${compact}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          </div>
          {showShop && (
            <div>
              <label className={field} htmlFor="p-shop">Shop name</label>
              <input id="p-shop" className={`input ${compact}`} value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={80} placeholder="Shown on your offers" />
            </div>
          )}
          {showShop && (
            <div>
              <label className={field} htmlFor="p-category">Shop category</label>
              <Select id="p-category" className={compact} value={category} onChange={setCategory} placeholder="Choose category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>
          )}
          <div>
            <label className={field} htmlFor="p-phone">Mobile number</label>
            <div className="flex">
              <span className="flex items-center rounded-l-md border border-r-0 border-purple-200 bg-purple-50 px-3 text-small text-muted">+91</span>
              <input id="p-phone" className={`input rounded-l-none ${compact}`} inputMode="numeric" autoComplete="tel-national" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="10 digit number" maxLength={14} />
            </div>
          </div>
          <div>
            <label className={field} htmlFor="p-city">City</label>
            <input id="p-city" className={`input ${compact}`} value={city} onChange={(e) => setCity(e.target.value)} maxLength={60}
              autoComplete="address-level2" placeholder="Coimbatore" />
          </div>
          {showShop && (
            <div className="sm:col-span-2">
              <label className={field} htmlFor="p-web">Website link <span className="font-normal text-muted">(optional)</span></label>
              <input id="p-web" type="url" inputMode="url" className={`input ${compact}`} value={website} onChange={(e) => setWebsite(e.target.value)}
                maxLength={200} placeholder="www.myshop.com" />
            </div>
          )}
        </div>

        {/* right: the shop location */}
        {showShop && (
          <div>
            <p className="text-small font-semibold">Shop location</p>
            <p className="mb-2 text-small text-muted">Saved once, used for every offer. You can pick another place when posting an offer.</p>
            <LocationPicker
              value={location}
              onChange={(loc) => {
                setLocation(loc);
                setLocationChanged(true);
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-purple-100 pt-3">
        <button className="btn-primary w-full sm:w-auto" disabled={busy || name.trim().length < 2}>
          {busy ? 'Saving...' : wasIncomplete ? 'Save and continue' : 'Save changes'}
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
