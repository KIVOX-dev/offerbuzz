import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';

const base = {
  MONGODB_URI: 'mongodb://x/y',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  OTP_SECRET: 'b'.repeat(32),
};

describe('env validation', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const e = loadEnv({ ...base } as NodeJS.ProcessEnv);
    expect(e.PORT).toBe(3001);
    expect(e.OTP_DEV_MODE).toBe(false);
  });

  it('fails fast on missing or weak secrets', () => {
    expect(() => loadEnv({ ...base, JWT_ACCESS_SECRET: 'short' } as NodeJS.ProcessEnv)).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => loadEnv({} as NodeJS.ProcessEnv)).toThrow(/MONGODB_URI/);
  });

  it('refuses dev OTP mode in production', () => {
    expect(() => loadEnv({ ...base, NODE_ENV: 'production', OTP_DEV_MODE: 'true' } as NodeJS.ProcessEnv)).toThrow(/OTP_DEV_MODE/);
  });
});
