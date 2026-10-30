/** Google Maps is loaded only on the pages that show a map, and only once per visit. */
export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
export const mapsConfigured = MAPS_KEY !== '';

declare global {
  interface Window {
    __offerbuzzMapsReady?: () => void;
  }
}

let loading: Promise<void> | undefined;

export function loadMaps(): Promise<void> {
  if (!mapsConfigured) return Promise.reject(new Error('Maps are not configured'));
  loading ??= new Promise<void>((resolve, reject) => {
    if (window.google?.maps) return resolve();
    window.__offerbuzzMapsReady = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&loading=async&v=weekly&libraries=places&callback=__offerbuzzMapsReady`;
    script.async = true;
    script.onerror = () => {
      loading = undefined; // allow a retry
      reject(new Error('Could not load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Opens Google Maps with directions to the shop. Works without the Maps key. */
export function directionsUrl(lat: number, lng: number, placeId?: string): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return placeId ? `${base}&destination_place_id=${encodeURIComponent(placeId)}` : base;
}
