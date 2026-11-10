'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useAccount } from './AccountShell';

/**
 * A QR code that is unique to the signed in account: it encodes a link carrying the account's referral code.
 * Generated in the browser, so nothing is sent to a third party.
 */
export function QrCard({ title, blurb, target = 'home' }: { title: string; blurb: string; target?: 'home' | 'vendor-signup' }) {
  const { user } = useAccount();
  const [link, setLink] = useState('');
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // vendor-signup opens the vendor sign up form with this code already filled in
    const path = target === 'vendor-signup' ? '/login?role=merchant' : '/?';
    const url = `${window.location.origin}${path}${target === 'vendor-signup' ? '&' : ''}ref=${encodeURIComponent(user.referralCode)}`;
    setLink(url);
    QRCode.toString(url, { type: 'svg', margin: 1, width: 200, errorCorrectionLevel: 'M', color: { dark: '#2e1065', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [user.referralCode, target]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the link is still shown for manual copy */
    }
  }

  async function download() {
    const dataUrl = await QRCode.toDataURL(link, { margin: 2, width: 800, errorCorrectionLevel: 'M', color: { dark: '#2e1065', light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `offerbuzz-${user.referralCode}.png`;
    a.click();
  }

  const message = `Join OfferBuzz and post your shop's offers to customers nearby. Sign up with my referral code ${user.referralCode}: ${link}`;

  /** The phone's share sheet with the QR picture attached when the browser allows it; otherwise just the message. */
  async function share() {
    try {
      const dataUrl = await QRCode.toDataURL(link, { margin: 2, width: 800, errorCorrectionLevel: 'M', color: { dark: '#2e1065', light: '#ffffff' } });
      const file = new File([await (await fetch(dataUrl)).blob()], `offerbuzz-${user.referralCode}.png`, { type: 'image/png' });
      const withFile: ShareData = { title: 'Join OfferBuzz', text: message, files: [file] };
      if (navigator.canShare?.(withFile)) return await navigator.share(withFile);
      if (navigator.share) return await navigator.share({ title: 'Join OfferBuzz', text: message });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // the person closed the share sheet
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="surface max-w-xl p-4 md:p-6" aria-labelledby="qr-title">
      <h2 id="qr-title" className="text-section font-bold">{title}</h2>
      <p className="mt-1 text-small text-muted">{blurb}</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-md border border-purple-200 bg-white"
          role="img"
          aria-label={`QR code for ${user.referralCode}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="text-small text-muted">Your unique code</p>
            <p className="text-section font-bold tracking-widest">{user.referralCode}</p>
          </div>
          <p className="break-all text-small text-muted">{link}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button type="button" className="btn-secondary btn-sm" onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
            <button type="button" className="btn-outline btn-sm" onClick={download} disabled={!link}>Download PNG</button>
            <button type="button" className="btn-primary btn-sm" onClick={() => void share()} disabled={!link}>Share</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  );
}
