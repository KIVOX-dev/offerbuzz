import { env } from '../config/env';

export interface ReverseGeocodeResult {
  address?: string;
  placeId?: string;
}
type Geocoder = (lat: number, lng: number) => Promise<ReverseGeocodeResult>;

const googleGeocoder: Geocoder = async (lat, lng) => {
  const key = env().GOOGLE_MAPS_API_KEY;
  if (!key) return {};
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return {};
    const body = (await res.json()) as { status?: string; results?: { formatted_address?: string; place_id?: string }[] };
    const first = body.status === 'OK' ? body.results?.[0] : undefined;
    return { address: first?.formatted_address, placeId: first?.place_id };
  } catch (err) {
    // a failed lookup never blocks saving the pin; the address can be filled in later by saving again
    console.error('Reverse geocoding failed:', (err as Error).message);
    return {};
  }
};

let geocoder = googleGeocoder;
/** Test seam. */
export const setReverseGeocoder = (g: Geocoder = googleGeocoder) => {
  geocoder = g;
};

/**
 * Looks up the address for a pin. Called only when a vendor saves a new location, and the result is stored on the
 * vendor, so Geocoding is never hit while customers browse.
 */
export const reverseGeocode: Geocoder = (lat, lng) => geocoder(lat, lng);

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

/**
 * Finds the point for a typed area or address (India only). Used when a merchant types the offer's location by hand
 * instead of auto-detecting it. Returns undefined when no Maps key is set or nothing matches, so posting never fails
 * because of it.
 */
export async function forwardGeocode(text: string): Promise<ForwardGeocodeResult | undefined> {
  const key = env().GOOGLE_MAPS_API_KEY;
  if (!key || !text.trim()) return undefined;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&components=country:IN&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return undefined;
    const body = (await res.json()) as {
      status?: string;
      results?: { formatted_address?: string; place_id?: string; geometry?: { location?: { lat: number; lng: number } } }[];
    };
    const first = body.status === 'OK' ? body.results?.[0] : undefined;
    const loc = first?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng, address: first?.formatted_address, placeId: first?.place_id } : undefined;
  } catch (err) {
    console.error('Forward geocoding failed:', (err as Error).message);
    return undefined;
  }
}
