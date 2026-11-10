'use client';

/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORIES, PROMO_PRESET_IMAGES, PROMO_THEMES, type PromoCardDTO, type PromoCardInput } from '@offerbuzz/shared';
import { PromoCardView, type PromoTheme } from '@/components/home/PromoCard';
import {
  ApiRequestError,
  createPromoCard,
  deletePromoCard,
  getAdminPromoCards,
  movePromoCard,
  seedPromoCards,
  updatePromoCard,
  uploadPromoImage,
} from '@/lib/api';
import { shrinkImage } from '@/lib/image';

const THEME_LABEL: Record<PromoTheme, { name: string; dot: string }> = {
  blue: { name: 'Cyan', dot: '#22d3ee' },
  indigo: { name: 'Pink', dot: '#f9a8d4' },
  teal: { name: 'Lime', dot: '#bef264' },
  orange: { name: 'Gold', dot: '#fde047' },
  gold: { name: 'Peach', dot: '#fdba74' },
};

/** The form: what the admin is typing, before it is saved. `id` is empty for a card that does not exist yet. */
interface Draft {
  id?: string;
  title: string;
  subtitle: string;
  offer: string;
  tagline: string;
  burst: [string, string, string];
  theme: PromoTheme;
  image: string;
  category: string;
  imageOnly: boolean;
  active: boolean;
}

const blank = (): Draft => ({
  title: '',
  subtitle: '',
  offer: '',
  tagline: '',
  burst: ['', '', ''],
  theme: 'blue',
  image: PROMO_PRESET_IMAGES[0],
  category: '',
  imageOnly: false,
  active: true,
});

const toDraft = (c: PromoCardDTO): Draft => ({
  id: c.id,
  title: c.title,
  subtitle: c.subtitle ?? '',
  offer: c.offer ?? '',
  tagline: c.tagline ?? '',
  burst: [c.burst[0] ?? '', c.burst[1] ?? '', c.burst[2] ?? ''],
  theme: c.theme,
  image: c.image,
  category: c.category ?? '',
  imageOnly: c.imageOnly,
  active: c.active,
});

const toInput = (d: Draft): PromoCardInput => ({
  title: d.title.trim(),
  subtitle: d.subtitle.trim() || undefined,
  offer: d.offer.trim() || undefined,
  tagline: d.tagline.trim() || undefined,
  burst: d.burst.map((l) => l.trim()).filter(Boolean),
  theme: d.theme,
  // an uploaded photo's address carries a "?v=" stamp the API does not accept back
  image: d.image.split('?')[0]!,
  category: (d.category || undefined) as PromoCardInput['category'],
  imageOnly: d.imageOnly,
  active: d.active,
});

export default function AdminBanners() {
  const router = useRouter();
  const [cards, setCards] = useState<PromoCardDTO[]>();
  const [draft, setDraft] = useState<Draft>();
  const [file, setFile] = useState<Blob>();
  const [fileUrl, setFileUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiRequestError && e.code === 'SESSION_EXPIRED') return router.replace('/admin/login');
      setError(e instanceof ApiRequestError ? e.message : e instanceof Error ? e.message : 'Something went wrong');
    },
    [router],
  );

  const load = useCallback(() => getAdminPromoCards().then((r) => setCards(r.cards)).catch(fail), [fail]);
  useEffect(() => void load(), [load]);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => d && { ...d, [k]: v });
  const setBurst = (i: number, v: string) => setDraft((d) => d && { ...d, burst: d.burst.map((b, j) => (j === i ? v.toUpperCase() : b)) as Draft['burst'] });

  function open(d: Draft) {
    setDraft(d);
    setFile(undefined);
    setFileUrl(undefined);
    setError(undefined);
    setNotice(undefined);
  }

  async function pickFile(f: File | undefined) {
    if (!f) return;
    setError(undefined);
    try {
      const small = await shrinkImage(f, { edges: [1512, 1250, 1000, 800], maxBytes: 580 * 1024 });
      setFile(small);
      setFileUrl(URL.createObjectURL(small));
    } catch (e) {
      fail(e);
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      if (!draft) return;
      const body = toInput(draft);
      let id = draft.id;
      if (id) await updatePromoCard(id, body);
      else id = (await createPromoCard(body)).card.id;
      if (file) await uploadPromoImage(id, file);
      await load();
      setDraft(undefined);
      setFile(undefined);
      setFileUrl(undefined);
      setNotice('Saved. The home page shows it within a minute.');
    });

  const remove = (c: PromoCardDTO) =>
    run(async () => {
      if (!window.confirm(`Delete the card "${c.title}"?`)) return;
      await deletePromoCard(c.id);
      if (draft?.id === c.id) setDraft(undefined);
      await load();
    });

  const move = (c: PromoCardDTO, dir: 'up' | 'down') => run(async () => setCards((await movePromoCard(c.id, dir)).cards));
  const toggle = (c: PromoCardDTO) =>
    run(async () => {
      await updatePromoCard(c.id, toInput({ ...toDraft(c), active: !c.active }));
      await load();
    });
  const seed = () => run(async () => setCards((await seedPromoCards()).cards));

  // what the preview draws: the form as typed, with the not yet uploaded photo if one was picked
  const preview = useMemo(
    () =>
      draft && {
        title: draft.title || 'Your headline',
        subtitle: draft.subtitle || undefined,
        offer: draft.offer || undefined,
        tagline: draft.tagline || undefined,
        burst: draft.burst,
        theme: draft.theme,
        image: fileUrl ?? draft.image,
        category: undefined,
        imageOnly: draft.imageOnly,
      },
    [draft, fileUrl],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold">Home page cards</h1>
          <p className="mt-1 text-muted">The banner cards on the home page. Change the words, colours and photo, add new ones, or reorder them.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => open(blank())}>Add a card</button>
      </div>

      {notice && <p role="status" className="text-small font-semibold text-green-700">{notice}</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* the list */}
        <section aria-label="Cards" className="space-y-3">
          {!cards ? (
            <p className="text-muted">Loading...</p>
          ) : cards.length === 0 ? (
            <div className="surface space-y-3 p-5 text-center">
              <p className="text-muted">No cards yet, so the home page shows the standard ones.</p>
              <button type="button" className="btn-outline" disabled={busy} onClick={seed}>Start from the standard cards</button>
            </div>
          ) : (
            <ul className="space-y-2">
              {cards.map((c, i) => (
                <li key={c.id} className={`surface flex items-center gap-3 p-2.5 ${draft?.id === c.id ? 'ring-2 ring-purple-500' : ''} ${c.active ? '' : 'opacity-60'}`}>
                  <img src={c.image} alt="" className="h-16 w-10 shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.imageOnly ? 'Image only' : `${c.title}${c.subtitle ? ` ${c.subtitle}` : ''}`}</p>
                    <p className="truncate text-small text-muted">{c.offer ?? 'No offer line'} · {c.category ?? 'No link'}{c.active ? '' : ' · hidden'}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    <button type="button" className="btn-outline btn-sm" aria-label="Move up" disabled={busy || i === 0} onClick={() => move(c, 'up')}>↑</button>
                    <button type="button" className="btn-outline btn-sm" aria-label="Move down" disabled={busy || i === cards.length - 1} onClick={() => move(c, 'down')}>↓</button>
                    <button type="button" className="btn-outline btn-sm" disabled={busy} onClick={() => toggle(c)}>{c.active ? 'Hide' : 'Show'}</button>
                    <button type="button" className="btn-primary btn-sm" onClick={() => open(toDraft(c))}>Edit</button>
                    <button type="button" className="btn-outline btn-sm !border-red-300 !text-danger" disabled={busy} onClick={() => remove(c)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* the editor, with a live preview */}
        <section aria-label="Edit card">
          {!draft || !preview ? (
            <p className="surface p-6 text-center text-muted">Pick a card to edit, or add a new one. The preview appears here.</p>
          ) : (
            <form
              className="surface grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_240px]"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="order-2 space-y-3 sm:order-1">
                <h2 className="text-section font-bold">{draft.id ? 'Edit card' : 'New card'}</h2>

                <label className="flex items-start gap-2 rounded-md border border-purple-200 bg-purple-50 p-2.5 text-small font-semibold">
                  <input type="checkbox" className="mt-0.5" checked={draft.imageOnly} onChange={(e) => set('imageOnly', e.target.checked)} />
                  <span>
                    Image only
                    <span className="block font-normal text-muted">Show just the photo, with no text, sticker, shade or effects. Use it for ready-made designed images.</span>
                  </span>
                </label>

                <div className={draft.imageOnly ? 'hidden' : 'space-y-3'}>
                <label className="block text-small font-semibold">
                  Headline
                  <input className="input mt-1" required={!draft.imageOnly} maxLength={40} value={draft.title} onChange={(e) => set('title', e.target.value)} />
                </label>
                <label className="block text-small font-semibold">
                  Small line under it <span className="font-normal text-muted">(optional, like "of India")</span>
                  <input className="input mt-1" maxLength={24} value={draft.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
                </label>
                <label className="block text-small font-semibold">
                  Offer <span className="font-normal text-muted">(in the dark pill)</span>
                  <input className="input mt-1" maxLength={24} value={draft.offer} onChange={(e) => set('offer', e.target.value)} />
                </label>
                <label className="block text-small font-semibold">
                  Tagline
                  <input className="input mt-1" maxLength={60} value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
                </label>

                <fieldset>
                  <legend className="text-small font-semibold">Sticker <span className="font-normal text-muted">(up to 3 short lines, leave empty for none)</span></legend>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {draft.burst.map((b, i) => (
                      <input key={i} className="input uppercase" aria-label={`Sticker line ${i + 1}`} maxLength={8} value={b} onChange={(e) => setBurst(i, e.target.value)} />
                    ))}
                  </div>
                </fieldset>
                </div>

                <fieldset className={draft.imageOnly ? 'hidden' : ''}>
                  <legend className="text-small font-semibold">Colour</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {PROMO_THEMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={draft.theme === t}
                        onClick={() => set('theme', t)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-small font-semibold ${draft.theme === t ? 'border-purple-600 bg-purple-50' : 'border-purple-100'}`}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ background: THEME_LABEL[t].dot }} />
                        {THEME_LABEL[t].name}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-small font-semibold">Photo</legend>
                  <div className="mt-1 grid grid-cols-6 gap-1.5">
                    {PROMO_PRESET_IMAGES.map((src) => (
                      <button
                        key={src}
                        type="button"
                        aria-label={`Use photo ${src}`}
                        aria-pressed={!fileUrl && draft.image === src}
                        onClick={() => {
                          set('image', src);
                          setFile(undefined);
                          setFileUrl(undefined);
                        }}
                        className={`overflow-hidden rounded-sm ring-offset-1 ${!fileUrl && draft.image === src ? 'ring-2 ring-purple-600' : ''}`}
                      >
                        <img src={src} alt="" className="aspect-[5/8] w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <label className="mt-2 block text-small font-semibold">
                    Or upload your own
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-small" onChange={(e) => void pickFile(e.target.files?.[0])} />
                  </label>
                  <p className="mt-1 text-small text-muted">
                    Best size: <strong>945 × 1512 px</strong> (80 × 128 mm, tall 5:8 shape). Bigger photos are shrunk automatically (JPEG, PNG or WebP, saved under 580 KB).
                    Other shapes are cropped to fit, so keep the main subject in the middle. The text sits over the top, so keep the top area calm.
                  </p>
                </fieldset>

                <label className="block text-small font-semibold">
                  Opens this category when tapped
                  <select className="input mt-1" value={draft.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Nothing (not a link)</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-small font-semibold">
                  <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
                  Show on the home page
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary" disabled={busy || (!draft.imageOnly && !draft.title.trim())}>{busy ? 'Saving...' : 'Save card'}</button>
                  <button type="button" className="btn-outline" disabled={busy} onClick={() => setDraft(undefined)}>Cancel</button>
                </div>
              </div>

              {/* live preview: the same component as the home page, at its real shape */}
              <div className="order-1 sm:order-2">
                <p className="mb-2 text-small font-semibold text-muted">Live preview</p>
                <div className="mx-auto w-[240px] max-w-full sm:sticky sm:top-4">
                  <PromoCardView card={preview} linked={false} />
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
