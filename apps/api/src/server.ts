import { env } from './config/env';
import { connectDb } from './config/db';
import { createApp } from './app';

async function main() {
  const PORT = env().X_ZOHO_CATALYST_LISTEN_PORT ?? env().PORT;
  const app = createApp();
  const server = app.listen(PORT, () => console.log(`OfferBuzz API listening on :${PORT}`));
  // Warm the connection, but keep serving /health even if Atlas is briefly unreachable.
  connectDb().catch((err) => console.error('Initial MongoDB connection failed:', err.message));

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
