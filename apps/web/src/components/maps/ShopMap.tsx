'use client';

import { useEffect, useRef, useState } from 'react';
import { directionsUrl, loadMaps, mapsConfigured } from '@/lib/maps';
import { PinIcon } from '../Icons';

/** A small map with the shop pin and a Get directions button. The map loads only when this is on the page. */
export function ShopMap({ lat, lng, address, placeId, name }: { lat: number; lng: number; address?: string; placeId?: string; name?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mapsConfigured || !box.current) return;
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !box.current) return;
        const position = { lat, lng };
        const map = new google.maps.Map(box.current, {
          center: position,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });
        new google.maps.Marker({ map, position, title: name });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, name]);

  return (
    <section aria-label="Shop location" className="surface overflow-hidden">
      {mapsConfigured && !failed && <div ref={box} className="h-56 w-full bg-purple-50" role="img" aria-label={`Map showing ${name ?? 'the shop'}`} />}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="flex min-w-0 flex-1 items-start gap-2 text-small">
          <PinIcon size={18} className="mt-0.5 shrink-0 text-purple-700" />
          <span>{address || 'Shop location'}</span>
        </p>
        <a href={directionsUrl(lat, lng, placeId)} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm gap-1.5">
          Get directions
        </a>
      </div>
    </section>
  );
}
