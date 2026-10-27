# Build context is the repo root:
#   docker buildx build --platform linux/amd64 -f apps/web/Dockerfile -t offerbuzz-web:latest .
# NEXT_PUBLIC_* values are inlined at build time, so pass them as build args.
FROM node:20-alpine AS build
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL=https://api.offerbuzz.co/api/v1
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @offerbuzz/shared && npm run build -w @offerbuzz/web

FROM node:20-alpine AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
# standalone output already contains only the production dependencies it traced
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static apps/web/.next/static
COPY --from=build /repo/apps/web/public apps/web/public
USER node
EXPOSE 3000
# Port: PORT, else the one AppSail injects, else 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-${X_ZOHO_CATALYST_LISTEN_PORT:-3000}}/" >/dev/null' || exit 1
CMD ["sh", "-c", "PORT=${PORT:-${X_ZOHO_CATALYST_LISTEN_PORT:-3000}} exec node apps/web/server.js"]
