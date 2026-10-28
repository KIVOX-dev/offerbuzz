import type { AdminAnalytics } from '@offerbuzz/shared';
import { PageHit, Visit } from '../../models/Visit';
import { User } from '../../models/User';

const IST_MS = 5.5 * 3_600_000;
const DAY_MS = 86_400_000;

/** YYYY-MM-DD in India time, `daysAgo` days before now. */
export const istDay = (daysAgo = 0, now = Date.now()) => new Date(now + IST_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|uptime/i;
const VISITOR_ID = /^[A-Za-z0-9-]{16,64}$/;

/** Cleans a page path to something safe to group by: no query or hash, no private areas, bounded length. */
export function cleanPath(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const path = input.split(/[?#]/)[0]?.trim() ?? '';
  if (!path.startsWith('/') || path.length > 120) return undefined;
  if (path.startsWith('/admin') || path.startsWith('/api')) return undefined;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** Records one page view. Quietly ignores bots, bad ids and private paths: tracking must never break a page. */
export async function recordView(input: { visitorId?: unknown; path?: unknown }, userAgent = '') {
  const path = cleanPath(input.path);
  const id = typeof input.visitorId === 'string' && VISITOR_ID.test(input.visitorId) ? input.visitorId : undefined;
  if (!path || !id || BOT.test(userAgent)) return;
  const day = istDay();
  await Promise.all([
    Visit.updateOne({ day, visitorId: id }, { $inc: { views: 1 } }, { upsert: true }),
    PageHit.updateOne({ day, path }, { $inc: { views: 1 } }, { upsert: true }),
  ]);
}

export async function analytics(days = 14): Promise<AdminAnalytics> {
  const list = Array.from({ length: days }, (_, i) => istDay(days - 1 - i)); // oldest first
  const [visits, hits, users] = await Promise.all([
    Visit.aggregate<{ _id: string; visitors: number; views: number }>([
      { $match: { day: { $gte: istDay(29) } } },
      { $group: { _id: '$day', visitors: { $sum: 1 }, views: { $sum: '$views' } } },
    ]),
    PageHit.aggregate<{ _id: string; views: number }>([
      { $match: { day: { $gte: istDay(6) } } },
      { $group: { _id: '$path', views: { $sum: '$views' } } },
      { $sort: { views: -1 } },
      { $limit: 8 },
    ]),
    User.find({ createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) } }).select('createdAt'),
  ]);

  const byDay = new Map(visits.map((v) => [v._id, v]));
  const newUsersByDay = new Map<string, number>();
  for (const u of users as unknown as { createdAt: Date }[]) {
    const d = istDay(0, u.createdAt.getTime());
    newUsersByDay.set(d, (newUsersByDay.get(d) ?? 0) + 1);
  }

  const sumRange = (n: number, pick: (day: string) => number) => Array.from({ length: n }, (_, i) => pick(istDay(i))).reduce((a, b) => a + b, 0);
  const visitorsOn = (d: string) => byDay.get(d)?.visitors ?? 0;
  const viewsOn = (d: string) => byDay.get(d)?.views ?? 0;
  const usersOn = (d: string) => newUsersByDay.get(d) ?? 0;

  // a visitor who comes on several days counts once per day; the 7 and 30 day figures are sums of daily visitors
  return {
    visitors: { today: visitorsOn(istDay()), last7: sumRange(7, visitorsOn), last30: sumRange(30, visitorsOn) },
    pageViews: { today: viewsOn(istDay()), last7: sumRange(7, viewsOn), last30: sumRange(30, viewsOn) },
    newUsers: { today: usersOn(istDay()), last7: sumRange(7, usersOn), last30: sumRange(30, usersOn) },
    series: list.map((day) => ({ day, visitors: visitorsOn(day), views: viewsOn(day), newUsers: usersOn(day) })),
    topPages: hits.map((h) => ({ path: h._id, views: h.views })),
  };
}
