'use client';

import jsQR from 'jsqr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QrIcon } from './Icons';

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts?: { formats?: string[] }) => Detector;

/** Reads a code from a video frame: the browser's BarcodeDetector (QR + product barcodes) when present, else jsQR (QR only). */
async function makeReader(): Promise<(video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<string | null>> {
  const Native = (window as unknown as { BarcodeDetector?: DetectorCtor & { getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (Native) {
    try {
      const wanted = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];
      const have = (await Native.getSupportedFormats?.()) ?? wanted;
      const detector = new Native({ formats: wanted.filter((f) => have.includes(f)) });
      return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
    } catch {
      /* fall through to jsQR */
    }
  }
  return async (video, canvas) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
  };
}

/**
 * An Amazon-style scan button: opens the camera, reads a QR code or product barcode and hands the text to `onResult`.
 * The camera feed is processed in the browser only and stops as soon as the sheet closes.
 */
export function ScanButton({ onResult, className = '' }: { onResult: (text: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError('');

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot open the camera. Try Chrome or Safari over HTTPS.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch {
        setError('Camera access was blocked. Allow the camera in your browser settings and try again.');
        return;
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      const el = video.current;
      if (!el) return;
      el.srcObject = stream;
      await el.play().catch(() => undefined);
      const read = await makeReader();

      const tick = async () => {
        if (stopped) return;
        try {
          const text = el.readyState >= 2 && canvas.current ? await read(el, canvas.current) : null;
          if (text && !stopped) {
            stopped = true;
            navigator.vibrate?.(60);
            setOpen(false);
            onResult(text);
            return;
          }
        } catch {
          /* a bad frame is skipped */
        }
        timer = setTimeout(tick, 200);
      };
      tick();
    })();

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onResult]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Scan a QR code or barcode" className={className}>
        <QrIcon />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Scanner" className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <h2 className="text-section font-bold">Scan a code</h2>
            <button type="button" onClick={close} className="btn-ghost btn-sm !text-white hover:!bg-white/10">
              Close
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video ref={video} muted playsInline className="h-full w-full object-cover" />
            <canvas ref={canvas} className="hidden" />
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-64 w-64 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                <span className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-accent" />
                <span className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-accent" />
                <span className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-accent" />
                <span className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-accent" />
              </div>
            </div>
          </div>

          <p role="status" className="p-4 text-center text-small text-white">
            {error || 'Point your camera at an OfferBuzz QR code or a product barcode.'}
          </p>
        </div>
      )}
    </>
  );
}
