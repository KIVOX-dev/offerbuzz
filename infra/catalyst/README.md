# Zoho Catalyst (API hosting)

The **API** runs on Catalyst AppSail as a Docker image (custom runtime). The website is on Vercel.

| Catalyst service | Image | Port |
|---|---|---|
| `offerbuzz-api` | `offerbuzz-api:latest` | 3001 |

`catalyst.json` and `.catalystrc` in the repo root bind this folder to the `offerbuzz` Catalyst project.
They contain ids only, no secrets, and are committed on purpose.

## Manual deploy
```
docker buildx build --platform linux/amd64 -f apps/api/Dockerfile -t offerbuzz-api:latest .
catalyst deploy appsail --name offerbuzz-api --source docker://offerbuzz-api:latest --port 3001
```
Always pass all three flags. Without them the CLI asks for a build directory (managed runtime flow).
The CLI deploys to the **Development** environment; a Production path is not set up yet.

Development URL: https://offerbuzz-api-50047221232.development.catalystappsail.in

## Automated deploy (GitHub Actions)
`.github/workflows/deploy.yml` runs after CI passes on `main`.

One time setup:
1. On your machine, logged in to Catalyst: `catalyst token:generate` and copy the token.
2. GitHub repo -> Settings -> Secrets and variables -> Actions:
   - Secret `CATALYST_TOKEN` = the token
   - Variable `API_URL` = the API base URL above (used for the post-deploy `/health` check)
   - Variables are optional. The workflow defaults to the ids in `.catalystrc`: project `89175000000043001` and
     `CATALYST_ORG_ID` = `60092523722`. In CI mode the CLI reads `--org` as the Development *environment* id, not the Zoho
     organisation id (found in `lib/command_needs/rc.js` of zcatalyst-cli). If you ever set these variables, the org value
     must not equal the project id.
3. Optional: Settings -> Environments -> `catalyst-dev` -> add required reviewers for a manual approval gate.
4. Revoke a leaked or old token with `catalyst token:list` then `catalyst token:revoke <id>`.

Not yet verified end to end: that the CLI can read the local Docker image on a GitHub runner, and the `--dc` flag
(not passed; the token carries the account). If the first run fails, the log will say which.

## Environment variables (Catalyst console -> AppSail -> offerbuzz-api)
`NODE_ENV=production`, `MONGODB_URI`, `CORS_ORIGINS` (comma separated web origins), `JWT_ACCESS_SECRET`,
`OTP_SECRET`, `OTP_DEV_MODE=false`, `GOOGLE_CLIENT_IDS`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`,
`GROQ_API_KEY` (Offera AI; optional `GROQ_MODELS` to change the fallback order),
`GOOGLE_MAPS_API_KEY` (used server side for the one reverse-geocode when a vendor saves a shop pin).
Do not set `DNS_SERVERS` (a local Windows workaround). Port: the API listens on `X_ZOHO_CATALYST_LISTEN_PORT`
if Catalyst injects it, otherwise `PORT`, otherwise 3001.

## One time
Seed the admin account against the production database from your machine, then clear the values from your shell:
`ADMIN_EMAIL` / `ADMIN_PASSWORD` set, then `npm run seed:admin`.

## DNS
Cloudflare: `api.offerbuzz.co` -> the API service. `offerbuzz.co` -> Vercel.
