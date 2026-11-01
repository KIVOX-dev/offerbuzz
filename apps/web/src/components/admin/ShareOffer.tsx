'use client';

import { useEffect, useState } from 'react';
import type { AdminOfferDTO } from '@offerbuzz/shared';

const discount = (o: AdminOfferDTO) =>
  o.discountType === 'percent' ? `${o.discountValue}% OFF` : o.discountType === 'amount' ? `Rs ${o.discountValue} OFF` : 'Special deal';

/** The post text: title, description, where it is, and the Google Maps link. */
export function offerCaption(o: AdminOfferDTO, pageUrl: string): string {
  return [
    `${o.title} (${discount(o)})`,
    '',
    o.description,
    '',
    `Shop: ${o.vendor}`,
    `Area: ${o.area}`,
    o.mapUrl ? `Location (Google Maps): ${o.mapUrl}` : '',
    o.phone ? `Call: ${o.phone}` : '',
    o.terms ? `Terms: ${o.terms}` : '',
    '',
    `More offers on OfferBuzz: ${pageUrl}`,
  ]
    .filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0))
    .join('\n');
}

async function fetchImage(o: AdminOfferDTO): Promise<File | undefined> {
  if (!o.imageUrl) return undefined;
  try {
    const r = await fetch(o.imageUrl);
    if (!r.ok) return undefined;
    const b = await r.blob();
    return new File([b], `offerbuzz-${o.id}.${b.type.split('/')[1] || 'jpg'}`, { type: b.type || 'image/jpeg' });
  } catch {
    return undefined;
  }
}

/**
 * "Share as post": on a phone it opens the share sheet with the photo and the caption (pick Instagram or Facebook).
 * Elsewhere a small menu offers Facebook, Instagram (caption copied, photo downloaded) and plain copy.
 * Instagram has no web share link, so the caption is copied for pasting into the post.
 */
export function ShareOffer({ o }: { o: AdminOfferDTO }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string>();

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(undefined), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const pageUrl = () => `${window.location.origin}/offers/${o.id}`;
  const caption = () => offerCaption(o, pageUrl());

  async function copy(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(caption());
      return true;
    } catch {
      return false;
    }
  }

  async function download() {
    const f = await fetchImage(o);
    if (!f) return false;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  }

  async function start() {
    const file = await fetchImage(o);
    const data: ShareData = { title: o.title, text: caption(), ...(file ? { files: [file] } : {}) };
    if (typeof navigator.share === 'function' && (!file || navigator.canShare?.(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    setOpen(true);
  }

  async function facebook() {
    await copy();
    const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}&quote=${encodeURIComponent(caption())}`;
    window.open(u, '_blank', 'noopener,noreferrer,width=640,height=600');
    setMsg('Caption copied too. Paste it into the post if Facebook leaves it out.');
    setOpen(false);
  }

  async function instagram() {
    const ok = await copy();
    const got = await download();
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    setMsg(`${ok ? 'Caption copied' : 'Copy the caption below'}${got ? ' and photo downloaded' : ''}. Create a new post on Instagram and paste.`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button type="button" className="btn-outline btn-sm" onClick={start}>Share as post</button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-purple-100 bg-card p-2 shadow-card">
          <button type="button" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-small font-semibold hover:bg-purple-50" onClick={facebook}>Share on Facebook</button>
          <button type="button" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-small font-semibold hover:bg-purple-50" onClick={instagram}>Post on Instagram</button>
          <button type="button" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-small font-semibold hover:bg-purple-50"
            onClick={async () => { setMsg((await copy()) ? 'Caption copied' : 'Could not copy'); setOpen(false); }}>
            Copy caption
          </button>
          <button type="button" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-small font-semibold hover:bg-purple-50" onClick={() => { void download(); setOpen(false); }}>Download photo</button>
          <button type="button" className="block w-full rounded-md px-3 py-1.5 text-left text-small text-muted" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
      {msg && <p role="status" className="absolute right-0 z-20 mt-2 w-64 rounded-md bg-ink p-2 text-small text-white">{msg}</p>}
    </div>
  );
}
