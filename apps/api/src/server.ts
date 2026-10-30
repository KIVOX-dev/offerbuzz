import { env } from './config/env';
import { connectDb } from './config/db';
import { createApp } from './app';
import { backfillOfferLocations } from './services/backfill';
import { startOfferExpiryJob } from './services/offerExpiry';

async function main() {
  const PORT = env().X_ZOHO_CATALYST_LISTEN_PORT ?? env().PORT;
  const app = createApp();
  const server = app.listen(PORT, () => console.log(`OfferBuzz API listening on :${PORT}`));
  // Warm the connection, but keep serving /health even if Atlas is briefly unreachable.
  connectDb()
    .then(() => backfillOfferLocations())
    .then((n) => n > 0 && console.log(`Gave ${n} older offers their shop's location`))
    .catch((err) => console.error('Initial MongoDB connection failed:', err.message));

  const stopExpiryJob = startOfferExpiryJob();
  const shutdown = () => {
    stopExpiryJob();
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
