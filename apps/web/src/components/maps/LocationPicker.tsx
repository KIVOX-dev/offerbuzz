'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationInput } from '@offerbuzz/shared';
import { loadMaps, mapsConfigured } from '@/lib/maps';
import { PinIcon, SearchIcon } from '../Icons';

type Suggestion = { id: string; text: string; place?: google.maps.places.Place };
type Found = { lat: number; lng: number; address?: string; placeId?: string; viewport?: google.maps.LatLngBounds | null };

const INDIA = { lat: 20.5937, lng: 78.9629 };
const MIN_CHARS = 3;
const DEBOUNCE_MS = 450;

/**
 * Pick the shop on a map: search with Places autocomplete, drag the pin, or use the current location. A moved pin
 * has no address yet; the API looks it up once when the profile is saved. A search result brings its own address.
 */
export function LocationPicker({ value, onChange }: { value?: LocationInput; onChange: (loc: LocationInput) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | undefined>(undefined);
  const marker = useRef<google.maps.Marker | undefined>(undefined);
  const token = useRef<google.maps.places.AutocompleteSessionToken | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const skipQuery = useRef(''); // text we filled in ourselves: do not search for it again
  const describeRef = useRef<(lat: number, lng: number) => Promise<void>>(async () => undefined);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(value?.address?.replace(/,\s*India$/i, '') ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  const [locating, setLocating] = useState(false);

  const showPin = useCallback((lat: number, lng: number) => {
    const pos = { lat, lng };
    marker.current?.setVisible(true);
    marker.current?.setPosition(pos);
    map.current?.panTo(pos);
    map.current?.setZoom(16);
  }, []);

  // build the map once; the script is fetched here, so only pages that show the picker pay for it
  useEffect(() => {
    if (!mapsConfigured || !box.current) return;
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !box.current) return;
        const start = value ?? INDIA;
        map.current = new google.maps.Map(box.current, {
          center: start,
          zoom: value ? 16 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy', // scroll and drag move the map directly, no "use ctrl + scroll" message
          clickableIcons: false,
        });
        marker.current = new google.maps.Marker({ map: map.current, position: start, draggable: true, visible: Boolean(value) });
        const moved = (lat: number, lng: number) => {
          marker.current?.setVisible(true);
          onChangeRef.current({ lat, lng });
          void describeRef.current(lat, lng);
        };
        marker.current.addListener('dragend', () => {
          const p = marker.current?.getPosition();
          if (p) moved(p.lat(), p.lng());
        });
        map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          marker.current?.setPosition(e.latLng);
          moved(e.latLng.lat(), e.latLng.lng());
        });
        token.current = new google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the map is created once; later moves go through showPin()
  }, []);

  // street address for a pin that was dragged, tapped or auto-detected: shown in the search box, saved with the pin
  describeRef.current = async (lat, lng) => {
    try {
      const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
      const { results } = await new Geocoder().geocode({ location: { lat, lng } });
      const first = results[0];
      if (!first) return;
      skipQuery.current = first.formatted_address.replace(/,\s*India$/i, '');
      setQuery(skipQuery.current);
      onChangeRef.current({ lat, lng, address: first.formatted_address, placeId: first.place_id });
    } catch {
      /* the pin is still saved; the server looks the address up when the profile is saved */
    }
  };

  // when a saved pin arrives (or changes from outside), the map moves to it
  useEffect(() => {
    if (!ready || !value) return;
    const p = marker.current?.getPosition();
    if (!p || Math.abs(p.lat() - value.lat) > 1e-7 || Math.abs(p.lng() - value.lng) > 1e-7) showPin(value.lat, value.lng);
    else if (!marker.current?.getVisible()) marker.current?.setVisible(true);
  }, [ready, value?.lat, value?.lng, showPin]);

  /** The point, address and boundary of a suggestion. Places first, the Geocoder when that is unavailable. */
  async function resolve(s: Suggestion): Promise<Found> {
    if (s.place) {
      try {
        await s.place.fetchFields({ fields: ['location', 'formattedAddress', 'id', 'viewport'] });
        const loc = s.place.location;
        if (loc) return { lat: loc.lat(), lng: loc.lng(), address: s.place.formattedAddress ?? s.text, placeId: s.place.id, viewport: s.place.viewport };
      } catch {
        /* fall through to the Geocoder */
      }
    }
    const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
    const { results } = await new Geocoder().geocode({ placeId: s.id });
    const g = results[0];
    if (!g) throw new Error('not found');
    return { lat: g.geometry.location.lat(), lng: g.geometry.location.lng(), address: g.formatted_address, placeId: g.place_id, viewport: g.geometry.viewport };
  }

  /** Free text with no suggestion picked: the Geocoder finds it, like pressing Enter in Google Maps. */
  async function findTyped(text: string): Promise<Found> {
    const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
    const { results } = await new Geocoder().geocode({ address: text, region: 'in', componentRestrictions: { country: 'IN' } });
    const g = results[0];
    if (!g) throw new Error('not found');
    return { lat: g.geometry.location.lat(), lng: g.geometry.location.lng(), address: g.formatted_address, placeId: g.place_id, viewport: g.geometry.viewport };
  }

  /** Put the pin on a found place: a whole area (Coimbatore) fits its boundary, a shop or street zooms in close. */
  function apply(f: Found, label: string) {
    skipQuery.current = label;
    setQuery(label);
    setSuggestions([]);
    setError('');
    showPin(f.lat, f.lng);
    if (f.viewport && !/\d/.test(label.split(',')[0] ?? '')) map.current?.fitBounds(f.viewport);
    onChangeRef.current({ lat: f.lat, lng: f.lng, address: f.address ?? label, placeId: f.placeId });
  }

  async function choose(s: Suggestion) {
    try {
      apply(await resolve(s), s.text);
    } catch {
      setError('Could not load that place. Try another search or tap the map to place the pin.');
    } finally {
      token.current = new google.maps.places.AutocompleteSessionToken(); // the search session ends with a selection
    }
  }

  async function searchTyped() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      apply(await findTyped(q), q);
    } catch {
      setError('We could not find that place. Check the spelling, or tap the map to place the pin.');
    } finally {
      setSearching(false);
    }
  }

  // suggestions while typing: wait for a pause, at least 3 characters. The newer Places API first, the classic one if
  // that is not available for the key. The best match is shown on the map straight away; the pin moves when one is picked.
  useEffect(() => {
    if (!ready) return;
    const q = query.trim();
    if (q.length < MIN_CHARS || q === skipQuery.current) {
      setSuggestions([]);
      return;
    }
    let stale = false;
    const id = setTimeout(async () => {
      setSearching(true);
      let list: Suggestion[] = [];
      let failed = false;
      try {
        const { suggestions: found } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: token.current,
          includedRegionCodes: ['in'],
        });
        list = found.flatMap((x) =>
          x.placePrediction ? [{ id: x.placePrediction.placeId, text: x.placePrediction.text.text, place: x.placePrediction.toPlace() }] : [],
        );
      } catch {
        try {
          const res = await new google.maps.places.AutocompleteService().getPlacePredictions({ input: q, componentRestrictions: { country: 'in' } });
          list = (res.predictions ?? []).map((p) => ({ id: p.place_id, text: p.description }));
        } catch {
          failed = true;
        }
      }
      if (stale) return;
      setSearching(false);
      setSuggestions(list);
      setNotice(failed ? 'Suggestions are not available right now. Press Enter to search.' : '');
      if (list[0]) {
        try {
          const f = await resolve(list[0]);
          if (stale) return;
          if (f.viewport) map.current?.fitBounds(f.viewport);
          else map.current?.panTo({ lat: f.lat, lng: f.lng });
        } catch {
          /* the preview is a bonus; the list is already showing */
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve only uses refs and the Maps library
  }, [query, ready]);

  function useMyLocation() {
    setError('');
    if (!navigator.geolocation) return setError('This browser cannot share your location. Search for your shop instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        showPin(lat, lng);
        onChange({ lat, lng });
        void describeRef.current(lat, lng);
      },
      () => {
        setLocating(false);
        setError('Location permission was denied. Search for your shop above, or drop the pin on the map.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (!mapsConfigured) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-small text-amber-900">
        Maps are not set up yet. Ask the site owner to add the Google Maps key.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-purple-700" />
            <input
              className="input pl-10 pr-14"
              placeholder="Search your shop, area or street"
              aria-label="Search for your shop"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (suggestions[0]) void choose(suggestions[0]);
                else void searchTyped();
              }}
              disabled={!ready}
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="button" aria-label="Search this place" onClick={() => (suggestions[0] ? void choose(suggestions[0]) : void searchTyped())}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-purple-700 px-3 py-1.5 text-small font-bold text-white hover:bg-purple-800 active:scale-95">
              Go
            </button>
          </div>
          <button type="button" className="btn-outline gap-1.5 whitespace-nowrap" onClick={useMyLocation} disabled={locating}>
            <PinIcon size={18} /> {locating ? 'Locating...' : 'My location'}
          </button>
        </div>
        {(suggestions.length > 0 || searching) && (
          <ul role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-purple-100 bg-card p-1.5 shadow-card-hover">
            {searching && suggestions.length === 0 && <li className="px-3 py-2 text-small text-muted">Searching...</li>}
            {suggestions.map((s) => (
              <li key={s.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left text-body hover:bg-purple-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void choose(s)}
                >
                  {s.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={box} className="h-64 w-full overflow-hidden lg:h-72 rounded-md border border-purple-200 bg-purple-50" />
      <p className="text-small text-muted">
        {value ? 'Pin saved. Drag it or tap the map to adjust.' : 'Search your shop, tap "My location", or tap the map to place the pin.'}
      </p>
      {notice && !error && <p className="text-small text-muted">{notice}</p>}
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
