import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';
import { HttpError } from '../utils/errors';

/**
 * Catalyst runs the API serverless, so keep exactly one connection (and one in-flight attempt)
 * per instance and reuse it across requests.
 */
const g = globalThis as unknown as { __mongo?: { promise?: Promise<typeof mongoose> } };
const state = (g.__mongo ??= {});

export async function connectDb(uri: string = env().MONGODB_URI): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  const dnsServers = env().DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);
  state.promise ??= mongoose
    .connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, autoIndex: env().NODE_ENV !== 'production' })
    .catch((err) => {
      state.promise = undefined; // allow a retry on the next request
      console.error('MongoDB connection failed:', err.message);
      throw new HttpError(503, 'DB_UNAVAILABLE', 'Service temporarily unavailable, please retry');
    });
  return state.promise;
}

export async function disconnectDb(): Promise<void> {
  state.promise = undefined;
  await mongoose.disconnect();
}
