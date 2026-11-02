# OfferBuzz

A hyperlocal offers marketplace. Local shops pay Rs 100 a month to post deals; customers find them by city and area on
the website. **Intermediaries** bring shops in with a personal QR code and earn credits for every paid month. An admin
approves offers and pays out credits.

- **Customers** browse, search and save offers. No account is needed. An assistant ("Offera AI") answers questions about live offers.
- **Vendors** (shops) register, pin their shop on a map and post offers with a photo.
- **Intermediaries** share a referral QR, see the shops they brought in, and request payouts from their wallet.
- **Admins** approve offers and intermediaries, record vendor payments, pay payouts, edit the home page banner cards, and see site analytics.

## Contents

1. [Architecture](#architecture)
2. [Repository layout](#repository-layout)
3. [Getting started](#getting-started)
4. [Configuration](#configuration)
5. [Commands](#commands)
6. [Features](#features)
7. [API reference](#api-reference)
8. [Business rules](#business-rules)
9. [Testing](#testing)
10. [CI/CD and deployment](#cicd-and-deployment)
11. [Security](#security)
12. [Troubleshooting](#troubleshooting)
13. [Roadmap](#roadmap)

## Architecture

```
 Browser
    |  HTTPS
    v
 +-----------------+      REST /api/v1       +---------------------------+
 | Website         | ----------------------> | API (Express, Docker)     |
 | Next.js on      |   (same-origin rewrite) | Zoho Catalyst AppSail     |
 | Vercel          |                         +-------------+-------------+
 +-----------------+                                       |
                                  +------------------------+--------------------+
                                  v                        v                    v
                           MongoDB Atlas              Brevo (email)         Groq, Google Maps
                           data and offer photos      login codes           assistant, geocoding
```

| Part | Where | How it deploys |
|---|---|---|
| Website and dashboards (`apps/web`) | Vercel, https://offerbuzz.vercel.app | Vercel Git integration: push to `main` is production, pull requests are previews |
| API (`apps/api`) | Zoho Catalyst AppSail, as a Docker image | GitHub Actions, after CI passes on `main` |
| Database | MongoDB Atlas | managed |
| Android app (`apps/mobile`) | Google Play | planned, not created yet |

The browser always calls the API on its own origin (`/api/v1`). `apps/web/next.config.js` rewrites that path to the real API,
so no CORS preflight is involved.

## Repository layout

```
apps/
  api/        Express + Mongoose REST API, Dockerfile, Vitest tests
  web/        Next.js (App Router) + Tailwind website and dashboards, vercel.json
packages/
  shared/     zod schemas, types, constants, design tokens (compiled to dist/ with tsc)
infra/
  docker-compose.yml   local development (web, api, mongo)
  catalyst/            Catalyst deploy notes
  brevo-templates/     email templates
docs/
  google-maps.md       shop pins, nearby search, cost controls
  offera-ai.md         the offers assistant
.github/
  workflows/ci.yml       typecheck, tests, builds, Docker smoke tests, audit
  workflows/deploy.yml   deploy the API to Catalyst
  dependabot.yml
catalyst.json, .catalystrc   bind this folder to the Catalyst project (ids only, no secrets)
```

`packages/shared` is the contract between the API and the website: request schemas, response types and constants live there once.
**Rebuild it after editing** (`npm run build:shared`); the API reads its compiled `dist/`.

Design tokens (colours, spacing, touch targets) live in `packages/shared/src/tokens.ts`.

## Getting started

Requirements: Node 20 (see `.nvmrc`), npm 10+, and a MongoDB (local, or an Atlas connection string).
Docker Desktop is only needed to build images or use `docker compose`.

```bash
git clone <repo> && cd offerbuzz
cp .env.example .env        # fill it in, see Configuration
npm install
npm run build:shared        # once, and again after editing packages/shared
npm run dev:api             # http://localhost:3001/health
npm run dev:web             # http://localhost:3000
npm run seed:admin          # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

With `OTP_DEV_MODE=true` (the default in `.env.example`) the login code is returned by the API and printed in its log,
so you can sign in without email set up.

The admin signs in at `/admin/login`. That page is not linked anywhere and is hidden from search engines.

Everything in Docker instead: `docker compose -f infra/docker-compose.yml up`.

## Configuration

All configuration is environment variables. One `.env` at the repo root is used locally (never committed, never copied
into an image). In production set the same names on the host: the Catalyst console for the API, Vercel project settings
for the website. The API validates its variables at startup and refuses to start if one is missing or weak.

### API

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | `mongodb+srv://...` with a database name |
| `JWT_ACCESS_SECRET`, `OTP_SECRET` | yes | 32+ random characters each |
| `CORS_ORIGINS` | yes in production | comma separated web origins allowed to call the API |
| `NODE_ENV` | | `production` on Catalyst |
| `OTP_DEV_MODE` | | `true` logs login codes and returns them as `devOtp`. **The API refuses to start with it on in production** |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | for real emails | login codes by email. Without a key, codes work only in dev mode |
| `GOOGLE_CLIENT_IDS` | for Google sign in | comma separated OAuth client ids. No client secret is needed |
| `GOOGLE_MAPS_API_KEY` | for shop pins | server side reverse geocoding when a vendor saves a pin |
| `GROQ_API_KEY`, `GROQ_MODELS` | optional | Offera AI. Without a key the assistant answers straight from the offers |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script only | password 12+ characters |
| `JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL_DAYS` | optional | defaults `15m` and `30` |
| `DNS_SERVERS` | local only | workaround when your resolver rejects `mongodb+srv` lookups, for example `8.8.8.8,1.1.1.1`. **Never set in production** |
| `PORT` | optional | default 3001. Catalyst's `X_ZOHO_CATALYST_LISTEN_PORT` wins when present |

### Website

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base including `/api/v1`. Inlined at build time, so redeploy the website when it changes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | same value as the API's `GOOGLE_CLIENT_IDS`. Without it the Google button explains it is not set up |
| `GOOGLE_MAPS_API_KEY` | the build copies it into the browser bundle (see `apps/web/next.config.js`) |

## Commands

| Command | What it does |
|---|---|
| `npm run dev:api`, `npm run dev:web` | local development servers (both rebuild `shared` first) |
| `npm run typecheck` | TypeScript check of shared, api and web |
| `npm test` | API tests against an in-memory MongoDB (the first run downloads a `mongod` binary) |
| `npm run build` | builds shared, api and web |
| `npm run seed:admin` | create or update the admin account |
| `npm run emails:export` | export the email templates (see `infra/brevo-templates`) |

## Features

### Website (`apps/web`)

| Area | Routes |
|---|---|
| Home: banner cards, offers near you, categories | `/` |
| Search, category pages, offer detail with map and directions | `/search`, `/offers/[id]` |
| Saved offers (kept in the browser) | `/saved` |
| Vendor and intermediary sign in / sign up | `/login`, `/login/vendor/sign-in`, `/login/vendor/sign-up`, `/login/intermediary/sign-in`, `/login/intermediary/sign-up` |
| Vendor dashboard, post an offer, shop profile | `/merchant/dashboard`, `/merchant/offers/new`, `/merchant/profile` |
| Intermediary dashboard, shops, wallet, QR, profile | `/intermediary/...` |
| Admin: overview, approvals, users, offers, wallets and payouts, home cards | `/admin/...` |
| Legal | `/privacy`, `/terms`, `/cookies` |

**Login.** Vendors and intermediaries sign in with email and password, a code sent by email, or Google. The role card you
open does not decide the account: the server sends you to the dashboard of the role your email is registered under.
Signing up with an email that already has an account says so and asks you to sign in.

**Home page banner cards.** The home page shows 5:8 photo cards with animated text (headline shine, glowing offer pill,
wiggling sticker). Admins manage them at `/admin/banners`: add, edit, reorder, hide or delete, with a live preview. Each card
has its own accent colour, a category it opens when tapped, and a photo (pick one of the ready photos or upload one;
best size 945 x 1512 px, 5:8). Until the admin saves any cards, the standard five from `packages/shared` are shown.
The text animations are switched off for people who prefer reduced motion.

**Offera AI.** A floating assistant that answers only questions about live offers. See [docs/offera-ai.md](docs/offera-ai.md).

**Maps.** Vendors pin their shop; customers see offers nearest first and get directions. See [docs/google-maps.md](docs/google-maps.md).

## API reference

Base path `/api/v1`. Liveness check at `GET /health` (no database call, so it stays up during a database blip).
Errors are always `{ "error": { "code", "message", "details?" } }`. Authenticated routes take `Authorization: Bearer <access token>`.

### Auth

| Endpoint | Purpose |
|---|---|
| `POST /auth/send-otp` | `{email, mode, role?}`. `mode` is `signin` (default) or `signup`. Emails a 6 digit code (30 second resend throttle, 5 minute expiry). Sign in for an unknown email returns 404 `ACCOUNT_NOT_FOUND`; sign up for a registered email returns 409 `ACCOUNT_EXISTS` |
| `POST /auth/verify-otp` | `{email, code, mode, role?, name?, referralCode?, category?}`. Sign up needs `name` and creates the account; sign in never creates one |
| `POST /auth/login` | email and password sign in for vendors and intermediaries |
| `POST /auth/set-password` | set or replace the password of the signed in user. Signs out other devices |
| `POST /auth/google` | `{idToken, role?}`, verified against `GOOGLE_CLIENT_IDS` |
| `POST /auth/admin/login`, `POST /auth/admin/google` | admin accounts only |
| `POST /auth/refresh`, `POST /auth/logout` | rotating single use refresh tokens. Replaying an old token revokes the whole session |
| `GET /me`, `PUT /me` | the signed in user; update profile and shop pin |

### Offers and search (public unless noted)

| Endpoint | Purpose |
|---|---|
| `GET /offers/nearby?lat=&lng=&radiusKm=` | live offers, closest first |
| `GET /offers/search?q=&category=&lat=&lng=`, `GET /search/suggest?q=` | search and suggestions |
| `GET /offers/by-ids?ids=` | the offers behind a saved list |
| `GET /offers/:id`, `GET /offers/:id/image` | one offer with its shop pin; its photo |
| `POST /offers`, `GET /offers/mine`, `DELETE /offers/:id`, `PUT /offers/:id/image` | vendor only: post, list, delete, upload a photo |
| `GET /banners`, `GET /banners/:id/image` | the home page cards and uploaded card photos |
| `POST /ai/chat`, `POST /ai/rewrite` | Offera AI; vendor description rewrite |
| `GET /referral/:code` | check an intermediary's referral code |
| `POST /track` | privacy friendly page view counting |

### Wallet (intermediaries)

| Endpoint | Purpose |
|---|---|
| `GET /wallet` | credits, pending and available, history |
| `POST /wallet/payout-request` | request a payout (details in the body) |

### Admin (admin token required)

| Endpoint | Purpose |
|---|---|
| `GET /admin/overview`, `GET /admin/analytics` | counts and site analytics |
| `GET /admin/users`, `PATCH /admin/users/:id/status` | list, approve or block users |
| `GET /admin/offers`, `PATCH /admin/offers/:id/status` | running and waiting offers; approve or reject |
| `POST /admin/vendors/:id/payment` | record a vendor's paid months (credits the intermediary) |
| `GET /admin/wallets`, `POST /admin/payouts/:id/pay`, `POST /admin/payouts/:id/reject` | payouts queue |
| `GET/POST /admin/banners`, `PUT/DELETE /admin/banners/:id`, `POST /admin/banners/:id/move`, `PUT /admin/banners/:id/image`, `POST /admin/banners/seed-defaults` | home page cards |

## Business rules

- Intermediaries start as `pending`; the wallet is active only after the admin approves them.
- A plain customer who signs up as Vendor or Intermediary is upgraded in place. No other role change is possible through login.
- Signing in always opens the account's own role, whichever role card was chosen.
- Admins cannot use code or Google login on the public page, and nobody can give themselves the `admin` role.
- Login codes are stored as HMAC hashes, are single use, and lock after 5 wrong attempts.
- Vendors need a shop pin before they can post (`409 LOCATION_REQUIRED` otherwise). Offers need admin approval and only run inside their dates.
- Business numbers (plan price, commission credits, hold days, payout threshold, grace days) live in the `settings` collection with defaults from `packages/shared`, never hardcoded in logic.
- Offer and card photos are shrunk in the browser first, checked by their first bytes on the server, and stored in MongoDB for now.

## Testing

`npm test` runs Vitest with Supertest against an in-memory MongoDB. Test setup blanks real credentials so a developer's
`.env` can never trigger real emails or database writes. The suites cover auth, the admin area, payouts, analytics, Offera AI,
offer expiry, email templates, environment validation and the home page cards. CI also builds both Docker images and starts them.

## CI/CD and deployment

```
pull request ---> CI (typecheck, tests, build, Docker build + start, audit) ---> Vercel preview
push to main --> CI --(passes)--> Deploy API workflow --> Catalyst AppSail --> /health check
              \--> Vercel production deploy (Git integration)
```

- **CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`. The audit job is informational.
- **Deploy API** (`.github/workflows/deploy.yml`) runs after CI succeeds on `main`: it builds the `linux/amd64` image, deploys it with
  the Catalyst CLI, then polls `/health` and fails if the API does not come up. Start it by hand from the Actions tab to redeploy `main`.
- **Website** is deployed by Vercel, not GitHub Actions. Vercel settings: Root Directory `apps/web`, "Include source files outside of the
  Root Directory" on, and `NEXT_PUBLIC_API_URL` set. `apps/web/vercel.json` supplies the install and build commands.
- **Dependabot** opens weekly update pull requests for npm, Docker and GitHub Actions.

### One time setup for the API deploy

On the GitHub environment `catalyst-dev` (Settings, Environments):

| Kind | Name | Value |
|---|---|---|
| Secret | `CATALYST_TOKEN` | output of `catalyst token:generate` |
| Variable | `API_URL` | the API base URL, for the post deploy health check |

Add required reviewers to that environment if you want a manual approval before each deploy. Environment variables for the running API
(database, secrets, keys) are set in the Catalyst console, not by the workflow. Full details and the manual deploy commands:
[infra/catalyst/README.md](infra/catalyst/README.md).

After the website has a URL, add its origin to the API's `CORS_ORIGINS`. Seed the production admin once from your machine
(`ADMIN_EMAIL` and `ADMIN_PASSWORD` set, then `npm run seed:admin`) and clear the values from your shell.

## Security

- Secrets live only in environment variables, never in code, images or the app bundle.
- Role based access control is enforced per route, with rate limits on code and login endpoints.
- Refresh tokens rotate, are stored hashed, and replay revokes the session family.
- Uploaded photos must really be a JPEG, PNG or WebP (checked by signature) and are served with `nosniff`.
- Website tokens are in `localStorage` for now. Moving the refresh token to an httpOnly cookie is on the pre-launch list.
- Before launch: error monitoring (Sentry), a shared rate limit store, database backups, and an accountant's confirmation of PAN and TDS
  rules for intermediary payouts.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `querySrv ECONNREFUSED` connecting to Atlas | Your DNS resolver rejects SRV lookups. Set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`, or use Atlas's non-SRV connection string |
| `Invalid environment configuration` on API start | A required variable is missing or too short. The message names it |
| TypeScript errors about missing fields from `@offerbuzz/shared` | The shared package is stale. Run `npm run build:shared` |
| Docker: `dockerDesktopLinuxEngine` pipe not found | Docker Desktop is not running. Start it and wait for "Engine running" (WSL 2 is required on Windows) |
| Catalyst deploy asks for a "build directory" | You left out `--name`, `--source` or `--port`. Pass all three |
| API on Catalyst answers 503 "Execution failed" | Environment variables are not set on the service, or the port is wrong. Check the service logs |
| Login works locally but not on the deployed site | The site's origin is missing from the API's `CORS_ORIGINS`, or `NEXT_PUBLIC_API_URL` points at the wrong API |
| Google button says it is not set up | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is missing on the website, or differs from the API's `GOOGLE_CLIENT_IDS` |
| Catalyst CLI shows a Node.js security warning | Upgrade your local Node to a patched release. CI uses a patched Node 22 for the CLI |
| New home cards do not show straight away | The public list is cached for up to a minute |

## Roadmap

Built so far: accounts and roles, offers with search and maps, vendor and intermediary dashboards, referral QR and wallet ledger,
payout requests, admin tools, Offera AI, site analytics, and the editable home page cards.

| Next | Scope |
|---|---|
| Payments | Razorpay subscription and webhooks, plan status, grace period (today an admin records payments by hand) |
| Storage | move offer and card photos from MongoDB to object storage (Backblaze B2) |
| Notifications | Brevo campaigns, push notifications, daily deal and expiry jobs, notification preferences |
| Android app | Expo app (`apps/mobile`), install referrer attribution, offline cache |
| Launch hardening | Sentry, uptime checks, backups, load test, store listing |
