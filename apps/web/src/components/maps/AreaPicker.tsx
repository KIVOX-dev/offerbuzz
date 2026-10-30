'use client';

import { useEffect, useRef, useState } from 'react';
import type { LocationInput } from '@offerbuzz/shared';
import { nameFromBigDataCloud } from '@/lib/location';
import { loadMaps, mapsConfigured } from '@/lib/maps';
import { PinIcon } from '../Icons';

type Suggestion = { id: string; text: string; place: google.maps.places.Place };

const MIN_CHARS = 3;
const DEBOUNCE_MS = 450;

/** "RS Puram, Coimbatore, Tamil Nadu, India" -> "RS Puram, Coimbatore, Tamil Nadu" */
const shorten = (s: string) => s.replace(/,\s*India$/i, '');

/**
 * Area and city for a point, looked up once when the vendor taps "Use my current location". Google when the Maps key is
 * set; otherwise (or if Google fails) a free key-less lookup, so the button always works.
 */
async function areaFromCoords(lat: number, lng: number): Promise<string | undefined> {
  if (mapsConfigured) {
    try {
      const area = await googleArea(lat, lng);
      if (area) return area;
    } catch {
      /* fall through to the free lookup */
    }
  }
  return nameFromBigDataCloud(lat, lng);
}

async function googleArea(lat: number, lng: number): Promise<string | undefined> {
  await loadMaps();
  const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
  const { results } = await new Geocoder().geocode({ location: { lat, lng } });
  const parts = results[0]?.address_components ?? [];
  const pick = (...types: string[]) => parts.find((c) => types.some((t) => c.types.includes(t)))?.long_name;
  const area = pick('sublocality_level_1', 'sublocality', 'neighborhood');
  const city = pick('locality', 'administrative_area_level_2');
  return [...new Set([area, city].filter(Boolean))].join(', ') || undefined;
}

/**
 * The "Area or city" box with Google Places suggestions while typing (after 3 characters and a short pause, one search
 * session per pick), a one-tap "Use my current location", and an optional one-tap "Use my shop location". Without a
 * Maps key it is a plain text box.
 */
export function AreaPicker({
  id,
  value,
  onChange,
  shopAddress,
  onPlace,
  placeholder = 'RS Puram, Coimbatore',
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  /** the vendor's saved shop address, offered as a quick pick */
  shopAddress?: string;
  /** the exact point behind the chosen area (undefined = no exact point, use the shop pin) */
  onPlace?: (p: LocationInput | undefined) => void;
  placeholder?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const token = useRef<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const picked = useRef(''); // text just chosen from the list, so choosing does not search again
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapsConfigured) return;
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled) return;
        token.current = new google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => undefined); // no map: it stays a plain text box
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // suggestions: wait for a pause in typing, 3+ characters; answers for an older text are ignored
  useEffect(() => {
    const q = value.trim();
    if (!ready || q.length < MIN_CHARS || q === picked.current) {
      setItems([]);
      return;
    }
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: token.current,
          includedRegionCodes: ['in'],
          includedPrimaryTypes: ['(regions)'],
        });
        if (stale) return;
        setItems(suggestions.flatMap((s) => (s.placePrediction ? [{ id: s.placePrediction.placeId, text: shorten(s.placePrediction.text.text), place: s.placePrediction.toPlace() }] : [])));
      } catch {
        if (!stale) setItems([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [value, ready]);

  /** a suggestion was picked: also fetch its exact point and address for directions */
  async function choosePlace(sug: Suggestion) {
    choose(sug.text);
    try {
      await sug.place.fetchFields({ fields: ['location', 'formattedAddress', 'id'] });
      const loc = sug.place.location;
      if (loc) onPlace?.({ lat: loc.lat(), lng: loc.lng(), address: sug.place.formattedAddress ?? undefined, placeId: sug.place.id });
    } catch {
      /* the area text is still filled in; directions fall back to the shop pin */
    }
  }

  function choose(text: string) {
    picked.current = text;
    onChange(text);
    setItems([]);
    setOpen(false);
    if (ready) token.current = new google.maps.places.AutocompleteSessionToken(); // a pick ends the search session
  }

  function useMyLocation() {
    setError('');
    if (!navigator.geolocation) return setError('This browser cannot share your location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const area = await areaFromCoords(pos.coords.latitude, pos.coords.longitude);
          // the exact GPS point goes with the offer, so customers get directions to this very spot
          onPlace?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (area) choose(area);
          else setError('Could not find the area name. Type it instead.');
        } catch {
          setError('Could not look up your area. Type it instead.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location permission was denied. Search or type the area instead.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div ref={root} className="relative">
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => {
          picked.current = '';
          onChange(e.target.value);
          onPlace?.(undefined); // typed by hand: the previous exact point no longer matches
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        maxLength={100}
        placeholder={placeholder}
        autoComplete="off"
        role={ready ? 'combobox' : undefined}
        aria-expanded={ready ? open && items.length > 0 : undefined}
      />

      <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-small font-bold text-purple-800 transition hover:bg-purple-100 active:scale-95 disabled:opacity-50"
          >
            <PinIcon size={16} /> {locating ? 'Finding your area...' : 'Use my current location'}
          </button>
          {shopAddress && (
            <button
              type="button"
              onClick={() => {
                choose(shorten(shopAddress));
                onPlace?.(undefined); // the shop pin is used
              }}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3 py-1.5 text-small font-semibold text-purple-800 transition hover:bg-purple-50 active:scale-95"
            >
              <PinIcon size={16} className="shrink-0" /> <span className="truncate">Use my shop location</span>
            </button>
          )}
      </div>
      {error && <p role="alert" className="mt-1 text-small text-danger">{error}</p>}

      {open && items.length > 0 && (
        <ul role="listbox" className="ob-fade-up absolute left-0 right-0 top-[52px] z-20 max-h-60 overflow-auto rounded-xl border border-purple-100 bg-card p-1.5 shadow-card-hover">
          {items.map((s) => (
            <li key={s.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choosePlace(s)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body transition-colors hover:bg-purple-50"
              >
                <PinIcon size={16} className="shrink-0 text-purple-700" />
                <span className="truncate">{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
