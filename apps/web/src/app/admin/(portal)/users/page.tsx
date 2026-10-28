'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AdminUserDTO, AdminUsersResponse } from '@offerbuzz/shared';
import { ApiRequestError, getAdminUsers, recordPayment, setUserStatus } from '@/lib/api';

const ROLE_TABS = [
  { value: '', label: 'All' },
  { value: 'merchant', label: 'Vendors' },
  { value: 'intermediary', label: 'Intermediaries' },
  { value: 'customer', label: 'Customers' },
];
const ROLE_LABEL: Record<string, string> = { merchant: 'Vendor', intermediary: 'Intermediary', customer: 'Customer', admin: 'Admin' };
const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  blocked: 'bg-red-100 text-red-800',
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminUsers() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersResponse>();
  const [months, setMonths] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/admin/login');
      setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
    },
    [router],
  );

  const load = useCallback(() => {
    setError(undefined);
    getAdminUsers({ role, status, q: query, page }).then(setData).catch(fail);
  }, [role, status, query, page, fail]);

  useEffect(load, [load]);

  async function act(id: string, fn: () => Promise<unknown>, done?: string) {
    setBusy(id);
    setError(undefined);
    setNotice(undefined);
    try {
      await fn();
      if (done) setNotice(done);
      load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(undefined);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // a plain function (not a component) so rows keep their state while the list re-renders
  const renderRow = (u: AdminUserDTO) => (
    <li key={u.id} className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{u.name || u.email}</p>
            <span className="rounded-sm bg-purple-100 px-2 py-0.5 text-small font-semibold text-purple-800">{ROLE_LABEL[u.role]}</span>
            <span className={`rounded-sm px-2 py-0.5 text-small font-semibold ${STATUS_STYLE[u.status]}`}>{u.status === 'pending' ? 'Needs approval' : u.status}</span>
          </div>
          <p className="text-small text-muted">
            {u.email}
            {u.phone ? ` · ${u.phone}` : ''}
            {u.city ? ` · ${u.city}` : ''}
          </p>
          <p className="text-small text-muted">
            {u.shopName ? `Shop: ${u.shopName} · ` : ''}Joined {fmt(u.createdAt)}
            {u.referredBy ? ` · Referred by ${u.referredBy}` : ''}
          </p>
          {u.role === 'merchant' && (
            <p className={`mt-1 text-small font-semibold ${u.subscribed ? 'text-green-700' : 'text-amber-700'}`}>
              {u.subscribed ? `Paid plan until ${fmt(u.paidUntil as string)}` : u.paidUntil ? `Plan ended ${fmt(u.paidUntil)}` : 'Not subscribed'}
            </p>
          )}
        </div>

        {u.role !== 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            {u.role === 'merchant' && (
              <>
                <select aria-label="Months paid" className="input h-9 w-auto px-2 text-small" value={months[u.id] ?? 1}
                  onChange={(e) => setMonths((m) => ({ ...m, [u.id]: Number(e.target.value) }))}>
                  {[1, 3, 6, 12].map((m) => (
                    <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <button type="button" className="btn-secondary btn-sm" disabled={busy === u.id}
                  onClick={() => act(u.id, () => recordPayment(u.id, months[u.id] ?? 1), `Payment recorded for ${u.name || u.email}`)}>
                  Record payment
                </button>
              </>
            )}
            {u.status !== 'active' && (
              <button type="button" className="btn-primary btn-sm" disabled={busy === u.id}
                onClick={() => act(u.id, () => setUserStatus(u.id, 'active'))}>
                {u.status === 'pending' ? 'Approve' : 'Unblock'}
              </button>
            )}
            {u.status !== 'blocked' && (
              <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy === u.id}
                onClick={() => window.confirm(`Block ${u.name || u.email}? They will be signed out.`) && act(u.id, () => setUserStatus(u.id, 'blocked'))}>
                Block
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-title font-bold">Users</h1>
        <p className="mt-1 text-muted">Approve intermediaries, block accounts, and record vendor subscription payments.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_TABS.map((t) => (
          <button key={t.value} type="button" className={`chip ${role === t.value ? 'chip-active' : ''}`}
            onClick={() => { setRole(t.value); setPage(1); }}>
            {t.label}
          </button>
        ))}
        <select aria-label="Status" className="input h-touch w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Needs approval</option>
          <option value="blocked">Blocked</option>
        </select>
        <form className="flex min-w-[220px] flex-1" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}>
          <input aria-label="Search users" className="input rounded-r-none" placeholder="Search name, email, phone or shop"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-primary rounded-l-none">Search</button>
        </form>
      </div>

      {notice && <p role="status" className="text-small font-semibold text-green-700">{notice}</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      {!data ? (
        <p className="text-muted">Loading...</p>
      ) : data.users.length === 0 ? (
        <p className="surface p-6 text-center text-muted">No users match.</p>
      ) : (
        <ul className="space-y-3">
          {data.users.map(renderRow)}
        </ul>
      )}

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between">
          <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-small text-muted">Page {page} of {pages} · {data.total} users</span>
          <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
