'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationInput } from '@offerbuzz/shared';
import { loadMaps, mapsConfigured } from '@/lib/maps';
import { PinIcon, SearchIcon } from '../Icons';

type Suggestion = { id: string; text: string; place: google.maps.places.Place };

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

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
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
        });
        marker.current = new google.maps.Marker({ map: map.current, position: start, draggable: true, visible: Boolean(value) });
        const moved = (lat: number, lng: number) => {
          marker.current?.setVisible(true);
          onChangeRef.current({ lat, lng });
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

  // autocomplete: wait for a pause in typing, at least 3 characters, one session token per search
  useEffect(() => {
    if (!ready) return;
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const { suggestions: found } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: token.current,
          includedRegionCodes: ['in'],
        });
        setSuggestions(
          found.flatMap((s) =>
            s.placePrediction ? [{ id: s.placePrediction.placeId, text: s.placePrediction.text.text, place: s.placePrediction.toPlace() }] : [],
          ),
        );
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, ready]);

  async function choose(s: Suggestion) {
    setSuggestions([]);
    setQuery(s.text);
    try {
      await s.place.fetchFields({ fields: ['location', 'formattedAddress', 'id'] });
      const loc = s.place.location;
      if (!loc) return;
      showPin(loc.lat(), loc.lng());
      onChange({ lat: loc.lat(), lng: loc.lng(), address: s.place.formattedAddress ?? s.text, placeId: s.place.id });
    } catch {
      setError('Could not load that place. Try another search or drop the pin on the map.');
    } finally {
      token.current = new google.maps.places.AutocompleteSessionToken(); // the search session ends with a selection
    }
  }

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
              className="input pl-10"
              placeholder="Search for your shop or street"
              aria-label="Search for your shop"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!ready}
              autoComplete="off"
            />
          </div>
          <button type="button" className="btn-outline gap-1.5 whitespace-nowrap" onClick={useMyLocation} disabled={locating}>
            <PinIcon size={18} /> {locating ? 'Locating...' : 'Use my current location'}
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

      <div ref={box} className="h-72 w-full overflow-hidden rounded-md border border-purple-200 bg-purple-50" />
      <p className="text-small text-muted">
        {value ? (
          <>
            Pin at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            {value.address ? ` · ${value.address}` : ''}. Drag the pin or click the map to adjust.
          </>
        ) : (
          'Search for your shop, use your current location, or click the map to drop the pin.'
        )}
      </p>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
