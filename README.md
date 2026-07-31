# Arc Bridge

A third-party USDC bridge for the [Arc network](https://arc.io), powered by [Circle CCTP V2](https://developers.circle.com/cctp).

Bridge native USDC to and from Arc — no wrapped tokens, no liquidity pools, no counterparty risk.

## Supported Chains

**Mainnet (real USDC)**
- Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Avalanche, Linea, Unichain, Sonic
- **Arc** (chain ID 5042) — CCTP live, `MessageTransmitter.localDomain()` = 26

**Testnet (test USDC)**
- Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, OP Sepolia, Arc Testnet (5042002)

## How it works

Uses Circle's Cross-Chain Transfer Protocol (CCTP V2):
1. **Approve** — user approves USDC spend on source chain
2. **Burn** — `depositForBurn` on source chain's `TokenMessenger`
3. **Attest** — poll Circle's Iris API until attestation is `complete`
4. **Mint** — `receiveMessage` on destination chain's `MessageTransmitter`

Fast transfers (~20s) cost 0.25 bps. Standard transfers are free.

## Local development

```bash
cp .env.local.example .env.local
# Add your WalletConnect Project ID from https://cloud.walletconnect.com

npm install
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel --cwd arc-bridge
```

Set `NEXT_PUBLIC_WC_PROJECT_ID` in your Vercel project environment variables.

## Tech stack

- Next.js 16 (App Router, Turbopack)
- Wagmi v2 + RainbowKit 2
- viem v2
- Tailwind CSS v3
- TanStack Query v5
