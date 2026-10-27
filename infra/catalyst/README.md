# Deploying to Zoho Catalyst AppSail

Two services, both Docker images (custom runtime):

| Catalyst service | Image | Port |
|---|---|---|
| `offerbuzz-site` (website) | `offerbuzz-web:latest` | 3000 |
| `offerbuzz-api` | `offerbuzz-api:latest` | 3001 |

## Build
```
docker buildx build --platform linux/amd64 -f apps/api/Dockerfile -t offerbuzz-api:latest .
docker buildx build --platform linux/amd64 -f apps/web/Dockerfile -t offerbuzz-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.offerbuzz.co/api/v1 .
```

## Deploy
```
catalyst deploy appsail --name offerbuzz-site --source docker://offerbuzz-web:latest --port 3000
catalyst deploy appsail --name offerbuzz-api  --source docker://offerbuzz-api:latest --port 3001
```
Always pass all three flags. Without them the CLI asks for a build directory, which is the managed-runtime flow.
The CLI deploys to the Development environment; a Production path is still to be worked out.

Development URLs:
- Web: https://offerbuzz-site-50047221232.development.catalystappsail.in
- API: https://offerbuzz-api-50047221232.development.catalystappsail.in

## Still unconfirmed
- Non-interactive CLI login for GitHub Actions.
- Maximum image size / registry limits.
- Whether Catalyst injects the port via `X_ZOHO_CATALYST_LISTEN_PORT` (both images accept it, with `PORT` as fallback).

## Environment variables (set in the Catalyst console, per service)
API: `NODE_ENV=production`, `MONGODB_URI`, `CORS_ORIGINS` (the web origin), `JWT_ACCESS_SECRET`, `OTP_SECRET`,
`OTP_DEV_MODE=false`, `GOOGLE_CLIENT_IDS`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SMS_SENDER`.
Do not set `DNS_SERVERS` (local workaround only).
Web: none at runtime (`NEXT_PUBLIC_*` are build args).

## One time
Run `npm run seed:admin` once against the production database with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set
(from your machine, with the Atlas URI), then remove those values from your shell.

## DNS
Cloudflare: `offerbuzz.co` -> web service, `api.offerbuzz.co` -> API service.
