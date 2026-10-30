'use client';

import { useState } from 'react';
import { CATEGORIES } from '@offerbuzz/shared';
import { ApiRequestError, updateProfile } from '@/lib/api';
import { Select } from '../Select';
import { useAccount } from './AccountShell';

/** Edit your own details. Email is shown but cannot be changed here. */
export function ProfileForm({ showShop }: { showShop?: boolean }) {
  const { user, setUser } = useAccount();
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ? user.phone.replace(/^\+91/, '') : '');
  const [shopName, setShopName] = useState(user.shopName ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [category, setCategory] = useState(user.category ?? '');
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
        ...(showShop ? { shopName: shopName.trim() } : {}),
        ...(showShop && !user.category && category ? { category: category as (typeof CATEGORIES)[number] } : {}),
      });
      setUser({ ...user, ...res.user });
      setMsg({ ok: true, text: 'Profile saved' });
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
        <label className="mb-1 block text-small font-semibold" htmlFor="p-name">Your name</label>
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
