'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useAccount } from './AccountShell';

/**
 * A QR code that is unique to the signed in account: it encodes a link carrying the account's referral code.
 * Generated in the browser, so nothing is sent to a third party.
 */
export function QrCard({ title, blurb }: { title: string; blurb: string }) {
  const { user } = useAccount();
  const [link, setLink] = useState('');
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(user.referralCode)}`;
    setLink(url);
    QRCode.toString(url, { type: 'svg', margin: 1, width: 200, errorCorrectionLevel: 'M', color: { dark: '#2e1065', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [user.referralCode]);

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
          </div>
        </div>
      </div>
    </section>
  );
}
