'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AdminAnalytics, AdminOverview } from '@offerbuzz/shared';
import { useAccount } from '@/components/account/AccountShell';
import { ApiRequestError, getAdminAnalytics, getAdminOverview } from '@/lib/api';

const n = (v: number) => v.toLocaleString('en-IN');

function Stat({ label, value, hint, href, alert }: { label: string; value: number; hint?: string; href?: string; alert?: boolean }) {
  const body = (
    <>
      <p className="text-small text-muted">{label}</p>
      <p className="mt-1 text-title font-bold">{n(value)}</p>
      {hint && <p className="mt-1 text-small text-muted">{hint}</p>}
    </>
  );
  const ring = alert && value > 0 ? 'ring-2 ring-amber-300' : '';
  return href ? (
    <Link href={href} className={`surface-hover block p-4 ${ring}`}>{body}</Link>
  ) : (
    <div className={`surface p-4 ${ring}`}>{body}</div>
  );
}

/** One row of three numbers: today, last 7 days, last 30 days. */
function Trio({ title, t }: { title: string; t: { today: number; last7: number; last30: number } }) {
  return (
    <div className="surface p-4">
      <p className="text-small font-semibold text-muted">{title}</p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          ['Today', t.today],
          ['7 days', t.last7],
          ['30 days', t.last30],
        ].map(([label, v]) => (
          <div key={label as string}>
            <dd className="text-section font-bold">{n(v as number)}</dd>
            <dt className="text-small text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Daily bars: height is that day's value; the exact numbers are in each bar's tooltip and the list below. */
function BarChart({ title, data, valueKey }: { title: string; data: AdminAnalytics['series']; valueKey: 'visitors' | 'views' | 'newUsers' }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const total = data.reduce((a, d) => a + d[valueKey], 0);
  return (
    <figure className="surface p-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="font-semibold">{title}</span>
        <span className="text-small text-muted">{n(total)} in 14 days</span>
      </figcaption>
      <div role="img" aria-label={`${title}, last 14 days: ${data.map((d) => `${dayLabel(d.day)} ${d[valueKey]}`).join(', ')}`}
        className="mt-3 flex h-32 items-end gap-1">
        {data.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${dayLabel(d.day)}: ${d[valueKey]}`}>
            <div className="w-full rounded-t-sm bg-purple-500" style={{ height: `${Math.max(d[valueKey] > 0 ? 4 : 1, (d[valueKey] / max) * 100)}%`, opacity: d[valueKey] ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-small text-muted">
        <span>{dayLabel(data[0]?.day ?? '')}</span>
        <span>{dayLabel(data[data.length - 1]?.day ?? '')}</span>
      </div>
    </figure>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAccount();
  const [o, setO] = useState<AdminOverview>();
  const [a, setA] = useState<AdminAnalytics>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fail = (e: unknown) => {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/admin/login');
      setError(e instanceof ApiRequestError ? e.message : 'Could not load the dashboard');
    };
    getAdminOverview().then(setO).catch(fail);
    getAdminAnalytics().then(setA).catch(fail);
  }, [router]);

  const totalUsers = o ? o.vendors.total + o.intermediaries.total + o.customers : 0;
  const maxPage = Math.max(1, ...(a?.topPages.map((p) => p.views) ?? [1]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-md bg-hero p-5 text-white shadow-glow md:p-6">
        <span className="badge-discount !bg-accent !text-ink">Admin</span>
        <h1 className="mt-3 text-title font-bold">Welcome, {user.name || user.email}</h1>
        <p className="mt-1 text-purple-100">Everything happening on the platform, at a glance.</p>
      </section>

      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <section aria-labelledby="traffic">
        <h2 id="traffic" className="mb-3 text-section font-bold">Website traffic</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Trio title="Visitors" t={a?.visitors ?? { today: 0, last7: 0, last30: 0 }} />
          <Trio title="Page views" t={a?.pageViews ?? { today: 0, last7: 0, last30: 0 }} />
          <Trio title="New sign ups" t={a?.newUsers ?? { today: 0, last7: 0, last30: 0 }} />
        </div>
        <p className="mt-2 text-small text-muted">
          Visitors are counted once per person per day, anonymously. Counting started when tracking went live, so earlier days show 0.
        </p>
        {a && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <BarChart title="Visitors per day" data={a.series} valueKey="visitors" />
            <BarChart title="New sign ups per day" data={a.series} valueKey="newUsers" />
          </div>
        )}
        <div className="surface mt-3 p-4">
          <h3 className="font-semibold">Most visited pages (7 days)</h3>
          {!a || a.topPages.length === 0 ? (
            <p className="mt-2 text-small text-muted">No page views recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {a.topPages.map((p) => (
                <li key={p.path} className="text-small">
                  <div className="flex justify-between gap-3">
                    <span className="truncate font-semibold">{p.path}</span>
                    <span className="shrink-0 text-muted">{n(p.views)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-purple-100">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${(p.views / maxPage) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="people">
        <h2 id="people" className="mb-3 text-section font-bold">Users</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total users" value={totalUsers} href="/admin/users" />
          <Stat label="Vendors" value={o?.vendors.total ?? 0} href="/admin/users" />
          <Stat label="Intermediaries" value={o?.intermediaries.total ?? 0} href="/admin/wallets" />
          <Stat label="Customers" value={o?.customers ?? 0} href="/admin/users" />
        </div>
      </section>

      <section aria-labelledby="vendors">
        <h2 id="vendors" className="mb-3 text-section font-bold">Vendor subscriptions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Subscribed (paid)" value={o?.vendors.subscribed ?? 0} href="/admin/users" hint="Plan active today" />
          <Stat label="Not subscribed" value={o?.vendors.unsubscribed ?? 0} href="/admin/users" hint="Never paid or plan ended" />
          <Stat label="Total vendors" value={o?.vendors.total ?? 0} href="/admin/users" />
        </div>
      </section>

      <section aria-labelledby="needs">
        <h2 id="needs" className="mb-3 text-section font-bold">Needs your attention</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Offers to approve" value={o?.pendingOffers ?? 0} href="/admin/offers" alert />
          <Stat label="Intermediaries to approve" value={o?.intermediaries.pendingApproval ?? 0} href="/admin/users" alert />
          <Stat label="Payout requests" value={o?.payouts.pending ?? 0} href="/admin/wallets" alert
            hint={o?.payouts.pending ? `Rs ${n(o.payouts.pendingCredits)} waiting` : undefined} />
        </div>
      </section>
    </div>
  );
}
