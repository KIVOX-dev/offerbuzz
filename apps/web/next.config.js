const path = require('node:path');

/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  // monorepo: trace files from the repo root so packages/shared is included in the standalone bundle
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@offerbuzz/shared'],
  poweredByHeader: false,
};
