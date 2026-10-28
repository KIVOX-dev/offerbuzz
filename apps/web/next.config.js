const path = require('node:path');

/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  // monorepo: trace files from the repo root so packages/shared is included in the standalone bundle
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@offerbuzz/shared'],
  poweredByHeader: false,
  // Brand images are pre-sized PNGs; skipping the optimizer avoids needing `sharp` in the standalone image.
  images: { unoptimized: true },
  // /admin has no page of its own; send people to the admin sign in
  async redirects() {
    return [{ source: '/admin', destination: '/admin/login', permanent: false }];
  },
  // Catalyst's gateway answers CORS preflights itself without CORS headers, so browsers cannot call the API
  // cross-origin. Set NEXT_PUBLIC_API_URL=/api/v1 and the browser stays same-origin; this forwards the call.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? 'https://offerbuzz-api-50047221232.development.catalystappsail.in';
    return [{ source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` }];
  },
};
