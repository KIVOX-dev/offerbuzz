'use client';

/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_PRESET_IMAGES, type CategoryTileDTO, type CategoryTileInput } from '@offerbuzz/shared';
import {
  ApiRequestError,
  createHomeCategory,
  deleteHomeCategory,
  getAdminHomeCategories,
  moveHomeCategory,
  seedHomeCategories,
  updateHomeCategory,
  uploadHomeCategoryImage,
} from '@/lib/api';
import { shrinkImage } from '@/lib/image';

/** The form: what the admin is typing, before it is saved. `id` is empty for a category that does not exist yet. */
interface Draft {
  id?: string;
  name: string;
  image: string;
  category: string;
  active: boolean;
}

const blank = (): Draft => ({ name: '', image: CATEGORY_PRESET_IMAGES[0]!, category: '', active: true });
const toDraft = (c: CategoryTileDTO): Draft => ({ id: c.id, name: c.name, image: c.image, category: c.category ?? '', active: c.active });
const toInput = (d: Draft): CategoryTileInput => ({
  name: d.name.trim(),
  // an uploaded photo's address carries a "?v=" stamp the API does not accept back
  image: d.image.split('?')[0]!,
  category: (d.category || undefined) as CategoryTileInput['category'],
  active: d.active,
});

export default function AdminCategories() {
  const router = useRouter();
  const [items, setItems] = useState<CategoryTileDTO[]>();
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

  const load = useCallback(() => getAdminHomeCategories().then((r) => setItems(r.categories)).catch(fail), [fail]);
  useEffect(() => void load(), [load]);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => d && { ...d, [k]: v });

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
      const small = await shrinkImage(f, { edges: [1000, 800, 640], maxBytes: 580 * 1024 });
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
      if (id) await updateHomeCategory(id, body);
      else id = (await createHomeCategory(body)).category.id;
      if (file) await uploadHomeCategoryImage(id, file);
      await load();
      setDraft(undefined);
      setFile(undefined);
      setFileUrl(undefined);
      setNotice('Saved. The home page shows it within a minute.');
    });

  const remove = (c: CategoryTileDTO) =>
    run(async () => {
      if (!window.confirm(`Delete the category "${c.name}"?`)) return;
      await deleteHomeCategory(c.id);
      if (draft?.id === c.id) setDraft(undefined);
      await load();
    });

  const move = (c: CategoryTileDTO, dir: 'up' | 'down') => run(async () => setItems((await moveHomeCategory(c.id, dir)).categories));
  const toggle = (c: CategoryTileDTO) =>
    run(async () => {
      await updateHomeCategory(c.id, toInput({ ...toDraft(c), active: !c.active }));
      await load();
    });
  const seed = () => run(async () => setItems((await seedHomeCategories()).categories));

  const shownImage = fileUrl ?? draft?.image;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-title font-bold">Categories</h1>
          <p className="mt-1 text-muted">The &quot;Shop by Category&quot; tiles on the home page. Rename them, change the photo, hide, reorder, add or delete.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => open(blank())}>Add a category</button>
      </div>

      {notice && <p role="status" className="text-small font-semibold text-green-700">{notice}</p>}
      {error && <p role="alert" className="text-small text-danger">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* the list */}
        <section aria-label="Categories" className="space-y-3">
          {!items ? (
            <p className="text-muted">Loading...</p>
          ) : items.length === 0 ? (
            <div className="surface space-y-3 p-5 text-center">
              <p className="text-muted">No categories saved yet, so the home page shows the standard ones.</p>
              <button type="button" className="btn-outline" disabled={busy} onClick={seed}>Start from the standard categories</button>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((c, i) => (
                <li key={c.id} className={`surface flex items-center gap-3 p-2.5 ${draft?.id === c.id ? 'ring-2 ring-purple-500' : ''} ${c.active ? '' : 'opacity-60'}`}>
                  <img src={c.image} alt="" className="h-14 w-11 shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-small text-muted">{c.category ?? 'Searches its name'}{c.active ? '' : ' · hidden'}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    <button type="button" className="btn-outline btn-sm" aria-label="Move up" disabled={busy || i === 0} onClick={() => move(c, 'up')}>↑</button>
                    <button type="button" className="btn-outline btn-sm" aria-label="Move down" disabled={busy || i === items.length - 1} onClick={() => move(c, 'down')}>↓</button>
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
        <section aria-label="Edit category" className="min-w-0">
          {!draft ? (
            <p className="surface p-6 text-center text-muted">Pick a category to edit, or add a new one. The preview appears here.</p>
          ) : (
            <form
              className="surface grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_180px]"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="order-2 min-w-0 space-y-3 xl:order-1">
                <h2 className="text-section font-bold">{draft.id ? 'Edit category' : 'New category'}</h2>

                <label className="block text-small font-semibold">
                  Name
                  <input className="input mt-1" required maxLength={40} value={draft.name} onChange={(e) => set('name', e.target.value)} />
                </label>

                <label className="block text-small font-semibold">
                  Opens this shop category when tapped
                  <select className="input mt-1" value={draft.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Search for the name instead</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <fieldset>
                  <legend className="text-small font-semibold">Photo</legend>
                  <div className="mt-1 grid grid-cols-6 gap-1.5">
                    {CATEGORY_PRESET_IMAGES.map((src) => (
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
                        <img src={src} alt="" className="aspect-[4/5] w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <label className="mt-2 block text-small font-semibold">
                    Or upload your own
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-small" onChange={(e) => void pickFile(e.target.files?.[0])} />
                  </label>
                  <p className="mt-1 text-small text-muted">
                    Best size: <strong>800 × 1000 px</strong> (4:5, portrait). Bigger photos are shrunk automatically. Other shapes are cropped to fit, and the name sits over the bottom, so keep that area calm.
                  </p>
                </fieldset>

                <label className="flex items-center gap-2 text-small font-semibold">
                  <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
                  Show on the home page
                </label>

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary" disabled={busy || !draft.name.trim()}>{busy ? 'Saving...' : 'Save category'}</button>
                  <button type="button" className="btn-outline" disabled={busy} onClick={() => setDraft(undefined)}>Cancel</button>
                </div>
              </div>

              {/* live preview: the tile as the home page draws it */}
              <div className="order-1 xl:order-2">
                <p className="mb-2 text-small font-semibold text-muted">Live preview</p>
                <div className="relative mx-auto aspect-[4/5] w-[180px] max-w-full overflow-hidden rounded-lg bg-purple-50 shadow-card xl:sticky xl:top-4">
                  {shownImage && <img src={shownImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 flex flex-col items-start gap-1.5">
                    <span className="line-clamp-2 text-body font-bold leading-tight text-white">{draft.name || 'Category name'}</span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-small font-semibold text-ink">Shop now</span>
                  </span>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
