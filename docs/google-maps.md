# Google Maps: shop locations and nearby offers

## What was built
| Piece | Where |
|---|---|
| Shop pin stored as GeoJSON `Point` (`[lng, lat]`) with a `2dsphere` index, plus cached `locationAddress` and `placeId` | `apps/api/src/models/User.ts` |
| Range check (lat -90..90, lng -180..180) | `packages/shared/src/schemas.ts` (`locationInputSchema`) |
| Save pin, reverse geocode once on save | `PUT /api/v1/me` with `{ location: { lat, lng, address?, placeId? } }` (`profile.routes.ts`, `services/geocode.ts`) |
| Vendors must have a pin before posting | `POST /api/v1/offers` returns `409 LOCATION_REQUIRED` |
| Nearby offers, closest first (`$geoNear`) | `GET /api/v1/offers/nearby?lat=&lng=&radiusKm=10&limit=30` (public) |
| One public offer with its shop pin | `GET /api/v1/offers/:id` (public) |
| Picker: draggable pin, Places autocomplete, "Use my current location" | `apps/web/src/components/maps/LocationPicker.tsx`, used in the vendor profile |
| Shop map + "Get directions" | `components/maps/ShopMap.tsx`, shown on `/offers/[id]` |
| Ask the visitor for their location on the home page | `components/maps/LocationPrompt.tsx`, `lib/location.ts` |

Cost controls: the Maps script loads only on pages that show a map; autocomplete waits 450 ms after typing stops, needs 3+ characters and uses one session token per search; Geocoding runs only when a vendor saves a *moved* pin with no address (same pin again, or a pin picked from search, never calls it); the nearby query uses MongoDB only (no Distance Matrix); the visitor's location stays in their browser.

## Setup checklist
1. Google Cloud: create a project, turn on billing.
2. Enable APIs: Maps JavaScript API, Places API (New), Geocoding API, Maps SDK for Android, Places SDK for Android.
3. Create one API key (Credentials -> Create credentials -> API key). Restrict it by **API** to the five above.
4. Set `GOOGLE_MAPS_API_KEY`:
   - local: `.env` (copy from `.env.example`)
   - Vercel: Project -> Settings -> Environment Variables, then redeploy (the value is inlined at build time)
   - Catalyst AppSail (API): Environment Variables, then redeploy
   - Docker web build: `--build-arg GOOGLE_MAPS_API_KEY=...`
5. Create the geo index on the existing database (it builds automatically on first start, but check): `db.users.getIndexes()` should list `location_2dsphere`.
6. In Google Cloud set a **budget alert** and a **per API daily quota**.
7. Existing vendors: they must open Profile -> Shop location and save a pin before they can post again.

## Security note about the shared, unrestricted key
The browser needs the key, so anyone can read it from the site's JavaScript. Because it has no application restriction, anyone can reuse it on their own sites and the usage is billed to this project. Mitigations that do not change this design: budget alerts, daily quotas, and API restrictions (already requested). Stronger, still simple: use **separate keys**: a web key restricted to HTTP referrers (`offerbuzz.co/*`, your Vercel domain), an Android key restricted to the app's package name + SHA-1, and a server key for the API restricted to Geocoding API.

## Android integration notes
There is no Android project in this repository yet, so these are notes for when it is added.
- Use the same key through the Secrets Gradle Plugin: put `MAPS_API_KEY=...` in `local.properties` (not committed) and reference `${MAPS_API_KEY}` in the manifest `<meta-data android:name="com.google.android.geo.API_KEY" .../>`.
- Dependencies: `com.google.android.gms:play-services-maps`, `com.google.android.libraries.places:places`, `com.google.android.gms:play-services-location`.
- Picker screen: `GoogleMap` with a draggable `Marker`; Places SDK `AutocompleteSessionToken` + `FindAutocompletePredictionsRequest` with the same rules (wait for a pause, 3+ characters, new token after a selection) and `FetchPlaceRequest` for `LAT_LNG`, `ADDRESS`, `ID`.
- Location permission: before requesting `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`, show a short reason ("We use your location to place your shop on the map / show nearby offers"). If denied, hide "Use my current location" and keep the search box and draggable pin working.
- Save with `PUT /api/v1/me` `{ "location": { "lat", "lng", "address"?, "placeId"? } }`; send `address` and `placeId` only when they came from a Places result, otherwise omit them and the API looks the address up once.
- Customers: call `GET /api/v1/offers/nearby?lat=&lng=&radiusKm=` and open directions with an intent to `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&destination_place_id=ID`.
