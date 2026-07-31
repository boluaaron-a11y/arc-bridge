import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // Stub all x402 packages – pulled in by @coinbase/cdp-sdk via @base-org/account
      // These are only needed for Coinbase smart-wallet features we don't use.
      "@x402/core": "./lib/stub.ts",
      "@x402/core/client": "./lib/stub.ts",
      "@x402/evm": "./lib/stub.ts",
      "@x402/evm/exact/client": "./lib/stub.ts",
      "@x402/evm/upto/client": "./lib/stub.ts",
      "@x402/svm/exact/client": "./lib/stub.ts",
    },
  },
};

export default nextConfig;
