# OfferBuzz

A hyperlocal offers marketplace. Shops pay Rs 100 per month to post discounts and deals; customers browse them by
city and area on a website and (later) an Android app. Intermediaries bring shops in through a personal QR code
and earn credits from every paid month.

**Status:** Phase 1 (Foundation) is built. Phases 2 to 9 are planned, see the [roadmap](#roadmap).

## How it is deployed

```
 Browser / Android app
        |
        |  HTTPS
        v
 +-----------------+        REST /api/v1        +--------------------------+
 | Website         | -------------------------> | API (Express, Docker)    |
 | Next.js         |                            | Zoho Catalyst AppSail    |
 | Vercel          |                            +------------+-------------+
 +-----------------+                                         |
                                        +--------------------+------------------+
                                        v                    v                  v
                                MongoDB Atlas        Backblaze B2 (+CDN)     Brevo
                                (Mumbai)             images, proofs          email only
```

| Part | Where | How it deploys |
|---|---|---|
| Website and dashboards (`apps/web`) | Vercel, https://offerbuzz.vercel.app | Git integration: push to `main` = production, pull requests = previews |
| API (`apps/api`) | Zoho Catalyst AppSail, Docker image | GitHub Actions after CI passes on `main` |
| Database | MongoDB Atlas | managed |
| Android app (`apps/mobile`) | Google Play | Phase 8, built with Expo |

## Repository layout

```
apps/
  api/            Express + Mongoose REST API, Dockerfile
  web/            Next.js 14 + Tailwind (website, dashboards), Dockerfile, vercel.json
  mobile/         Expo app (Phase 8, not created yet)
packages/
  shared/         zod schemas, types, constants, design tokens (compiled to dist/ with tsc)
infra/
  docker-compose.yml   local development (web, api, mongo)
  catalyst/            Catalyst deploy notes
.github/
  workflows/ci.yml       typecheck, tests, builds, Docker smoke tests
  workflows/deploy.yml   deploy the API to Catalyst
  dependabot.yml
catalyst.json, .catalystrc   binds this folder to the Catalyst project (ids only, no secrets)
```

Design tokens (colors, spacing, header height, touch targets) live once in `packages/shared/src/tokens.ts`.
Tailwind reads them today and the React Native theme will read them in Phase 8.

## Getting started

Requirements: Node 20 (see `.nvmrc`), npm 10+, and either a local MongoDB or a MongoDB Atlas connection string.
Docker Desktop is only needed to build images or to use `docker compose`.

```
git clone <repo> && cd offerbuzz
cp .env.example .env        # then fill it in, see "Configuration"
npm install
npm run build:shared        # required once, and again after editing packages/shared
npm run dev:api             # http://localhost:3001/health
npm run dev:web             # http://localhost:3000
npm run seed:admin          # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
```

The admin signs in at `/admin/login`. That page is not linked anywhere and is excluded from search engines.

Everything in Docker instead: `docker compose -f infra/docker-compose.yml up`.

### Configuration

All configuration is environment variables. One `.env` at the repo root is used locally (never committed, never
copied into an image). In production, set the same names on the host (Catalyst console, Vercel project settings).
The API validates its variables at startup and refuses to start with missing or weak values.

| Variable | Used by | Notes |
|---|---|---|
| `MONGODB_URI` | api | Atlas `mongodb+srv://...` string with a database name |
| `JWT_ACCESS_SECRET`, `OTP_SECRET` | api | 32+ random characters each |
| `CORS_ORIGINS` | api | comma separated web origins allowed to call the API |
| `OTP_DEV_MODE` | api | `true` logs the code and returns it as `devOtp`. The API refuses to start with it on in production |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | api | email delivery through Brevo (no SMS). Without a key, login codes work only in dev mode |
| `GOOGLE_CLIENT_IDS` | api | comma separated OAuth client ids for Google sign in |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed script | password 12+ characters |
| `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME` | api | Backblaze B2, used from Phase 3 |
| `DNS_SERVERS` | api | optional, local workaround when your resolver rejects `mongodb+srv` lookups (for example `8.8.8.8,1.1.1.1`). Do not set in production |
| `NEXT_PUBLIC_API_URL` | web | API base including `/api/v1`. Inlined at build time, so redeploy the web app when it changes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | web | optional |

## Commands

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript check of shared, api and web |
| `npm test` | API tests against an in-memory MongoDB (the first run downloads a mongod binary) |
| `npm run build` | builds shared, api and web |
| `npm run dev:api` / `npm run dev:web` | local development servers |
| `npm run seed:admin` | create or update the admin account |

## API (Phase 1)

Base path `/api/v1`. Liveness check at `GET /health` (no database call, so it stays up during a database blip).
Errors are always `{ "error": { "code", "message", "details?" } }`.

| Endpoint | Purpose |
|---|---|
| `POST /auth/send-otp` | `{email, mode, role?}`. `mode` is `signup` or `signin` (default). Emails a 6 digit code. 30 second resend throttle, 5 minute expiry. Sign in for an unknown email returns 404 `ACCOUNT_NOT_FOUND`; sign up for a registered email returns 409 `ACCOUNT_EXISTS` |
| `POST /auth/verify-otp` | `{email, code, mode, role?, name?}`. Sign up requires `name` and creates the account; sign in never creates one. Roles: `customer` (default), `merchant`, `intermediary` |
| `POST /auth/google` | `{idToken, role?}`, verified against `GOOGLE_CLIENT_IDS` |
| `POST /auth/admin/login` | email and password, admin accounts only |
| `POST /auth/refresh`, `POST /auth/logout` | rotating single use refresh tokens. Replaying an old token revokes the whole session |
| `GET /me` | the signed in user |

### Rules decided where the spec was silent

- Intermediaries start as `pending`; the wallet activates only after admin approval (Phases 5 and 6).
- A customer who picks Vendor or Intermediary is upgraded in place. No other role change is possible through login.
- Admins cannot use OTP or Google login, and nobody can give themselves the `admin` role.
- Login is by emailed code or Google only; there is no SMS. Phone numbers are profile data (shop contact), Indian mobiles only.
- OTP codes are stored as HMAC hashes, are single use, and lock after 5 wrong attempts.
- Business numbers (plan price, commission credits, hold days, payout threshold, grace days) live in the `settings`
  collection with defaults from `packages/shared`, never hardcoded in logic.

## Testing

`npm test` runs Vitest with Supertest against an in-memory MongoDB. Test setup blanks real credentials so a developer's
`.env` can never trigger real emails or database writes. CI also builds both Docker images and starts them as a
smoke test.

## CI/CD

```
pull request ---> CI (typecheck, tests, build, Docker build + start, audit) ---> Vercel preview
push to main --> CI --(passes)--> Deploy API workflow --> Catalyst AppSail --> /health check
              \--> Vercel production deploy (Git integration)
```

- **CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`. The audit job is informational.
- **Deploy API** (`.github/workflows/deploy.yml`) runs only after CI succeeds on `main`, builds the `linux/amd64` image,
  deploys it with the Catalyst CLI, then polls `/health` and fails the run if the API does not come up.
  It can also be started by hand from the Actions tab to redeploy `main`.
- **Website** is deployed by Vercel, not by GitHub Actions.
- **Dependabot** opens weekly update pull requests for npm, Docker and GitHub Actions.

One time setup for the API deploy, and details on manual deploys: [infra/catalyst/README.md](infra/catalyst/README.md).

Vercel project settings: Root Directory `apps/web`, "Include source files outside of the Root Directory" turned on, and
`NEXT_PUBLIC_API_URL` set. `apps/web/vercel.json` supplies the install and build commands.
After the site has a URL, add it to the API's `CORS_ORIGINS`.

## Security notes

- Secrets live only in environment variables, never in code, images or the app bundle.
- Role based access control is enforced per route. Rate limits cover OTP and login endpoints.
- Refresh tokens rotate, are stored hashed, and replay revokes the session family.
- Web tokens are in `localStorage` for now. Moving the refresh token to an httpOnly cookie is on the pre-launch list.
- Before launch: Sentry, a shared rate limit store, backups, and an accountant's confirmation of PAN and TDS rules for
  intermediary payouts.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `querySrv ECONNREFUSED` connecting to Atlas | Your DNS resolver rejects SRV lookups. Set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`, or use Atlas's non-SRV connection string |
| `Invalid environment configuration` on API start | A required variable is missing or too short. The message names it |
| Docker: `dockerDesktopLinuxEngine` pipe not found | Docker Desktop is not running. Start it and wait for "Engine running" (WSL 2 is required on Windows) |
| Catalyst deploy asks for a "build directory" | You omitted `--name`, `--source` or `--port`. Pass all three |
| API on Catalyst answers 503 "Execution failed" | Environment variables are not set on the service, or the port is wrong. Check the service logs |
| Login works locally but not on the deployed site | The site's origin is missing from the API's `CORS_ORIGINS`, or `NEXT_PUBLIC_API_URL` points at the wrong API |
| Catalyst CLI shows a Node.js security warning | Upgrade your local Node to a patched release. CI uses a patched Node 22 for the CLI |

## Roadmap

| Phase | Scope | State |
|---|---|---|
| 1 | Monorepo, Docker, design tokens, MongoDB, auth (emailed code, Google, sign up / sign in), roles | done |
| 2 | Categories, server driven home, offers list with search, filters and geo queries, saved offers, location selector, seed data | next |
| 3 | Merchant registration, shop profile, Backblaze uploads, Post Your Offer, admin approvals | |
| 4 | Razorpay subscription, webhooks, plan status, grace period, offer activation and expiry | |
| 5 | QR codes, referral attribution, wallet ledger, 30 credit commission with 1 year hold, intermediary dashboard | |
| 6 | Payout request, admin queue with UTR and screenshot proof, confirmation and disputes | |
| 7 | Brevo emails, Firebase push, daily deal and expiry cron jobs, notification preferences | |
| 8 | Android app (Expo), Install Referrer attribution, offline cache, signed .aab | |
| 9 | Sentry, uptime checks, backups, load test, policy pages, Google Play listing | |
#   o f f e r b u z z  
 