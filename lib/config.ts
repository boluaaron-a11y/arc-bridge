// ── Chain & CCTP configuration ───────────────────────────────────────────────
// Mainnet chains are REAL — you can bridge actual USDC between them.
// Arc Testnet (5042002) is for testing; Arc Mainnet (5042) is live but CCTP
// contracts are not yet deployed there — it will be enabled once Circle adds them.
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  avalanche,
  linea,
  unichain,
  sonic,
} from "viem/chains";

// ── Arc custom chain definitions ──────────────────────────────────────────────

// Arc Testnet — chain ID 5042002, CCTP domain 26
export const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"] },
    public: { http: ["https://rpc.testnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://explorer.testnet.arc.io" },
  },
  testnet: true,
} as const;

// Arc Mainnet — chain ID 5042, live since May 2026.
// NOTE: CCTP V2 contracts are NOT yet deployed on Arc mainnet.
//       This entry is here for RPC/explorer lookups only.
//       It is excluded from CCTP_DOMAINS intentionally until Circle deploys.
export const arcMainnet = {
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.arc.io"] },
    public: { http: ["https://rpc.arc.io"] },
    // Radar's publicly-accessible RPC (confirmed working):
    radar: { http: ["https://radar-api-rpc.up.railway.app"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://explorer.arc.io" },
  },
  testnet: false,
} as const;

// ── CCTP Domain IDs ───────────────────────────────────────────────────────────
export const CCTP_DOMAINS: Record<number, number> = {
  [mainnet.id]: 0,
  [avalanche.id]: 1,
  [optimism.id]: 2,
  [arbitrum.id]: 3,
  [base.id]: 6,
  [polygon.id]: 7,
  [unichain.id]: 10,
  [linea.id]: 11,
  [sonic.id]: 13,
  // Arc Testnet — domain 26 (confirmed by Circle docs)
  [arcTestnet.id]: 26,
  // Arc Mainnet — domain 26 also (same domain, confirmed live: MessageTransmitter.localDomain() = 0x1a)
  [arcMainnet.id]: 26,
};

// ── Iris Attestation API ──────────────────────────────────────────────────────
// Mainnet: iris-api.circle.com  |  Testnet: iris-api-sandbox.circle.com
export const IRIS_API = {
  mainnet: "https://iris-api.circle.com",
  testnet: "https://iris-api-sandbox.circle.com",
} as const;

// ── CCTP V2 Contract Addresses ────────────────────────────────────────────────
// All mainnet EVM chains share the same V2 addresses
export const CCTP_CONTRACTS = {
  mainnet: {
    tokenMessenger: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d" as const,
    messageTransmitter: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as const,
  },
  testnet: {
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const,
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const,
  },
} as const;

// ── USDC Addresses by Chain ID ────────────────────────────────────────────────
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  // Mainnet
  [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [arbitrum.id]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [optimism.id]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  [polygon.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  [avalanche.id]: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  [linea.id]: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
  [unichain.id]: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
  [sonic.id]: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
  // Testnet
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Eth Sepolia
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",   // Base Sepolia
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arb Sepolia
  11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // OP Sepolia
  // Arc Testnet — USDC deployed at the same address as on other testnet chains
  [arcTestnet.id]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  // Arc Mainnet USDC (bridged USDC.e exists at 0x36000... — native USDC pending CCTP launch)
  [arcMainnet.id]: "0x3600000000000000000000000000000000000000",
};

// ── Supported bridge chains (grouped) ────────────────────────────────────────
export const MAINNET_CHAINS = [
  { chain: mainnet, label: "Ethereum", logo: "🔷" },
  { chain: base, label: "Base", logo: "🔵" },
  { chain: arbitrum, label: "Arbitrum", logo: "🔵" },
  { chain: optimism, label: "OP Mainnet", logo: "🔴" },
  { chain: polygon, label: "Polygon", logo: "🟣" },
  { chain: avalanche, label: "Avalanche", logo: "🔺" },
  { chain: linea, label: "Linea", logo: "⚫" },
  { chain: unichain, label: "Unichain", logo: "🦄" },
  { chain: sonic, label: "Sonic", logo: "⚡" },
  { chain: arcMainnet, label: "Arc", logo: "🌐" },
] as const;

export const TESTNET_CHAINS = [
  { chain: { id: 11155111, name: "Ethereum Sepolia" }, label: "Ethereum Sepolia", logo: "🔷" },
  { chain: { id: 84532, name: "Base Sepolia" }, label: "Base Sepolia", logo: "🔵" },
  { chain: { id: 421614, name: "Arbitrum Sepolia" }, label: "Arbitrum Sepolia", logo: "🔵" },
  { chain: { id: 11155420, name: "OP Sepolia" }, label: "OP Sepolia", logo: "🔴" },
  { chain: arcTestnet, label: "Arc Testnet", logo: "🌐" },
] as const;

// ── ABIs (minimal) ────────────────────────────────────────────────────────────
export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const TOKEN_MESSENGER_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    outputs: [],
  },
] as const;

export const MESSAGE_TRANSMITTER_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
export const TESTNET_CHAIN_IDS = [11155111, 84532, 421614, 11155420, arcTestnet.id];

export function isTestnet(chainId: number): boolean {
  return TESTNET_CHAIN_IDS.includes(chainId);
}

export function getIrisApi(chainId: number): string {
  return isTestnet(chainId) ? IRIS_API.testnet : IRIS_API.mainnet;
}

export function getCctpContracts(chainId: number) {
  return isTestnet(chainId) ? CCTP_CONTRACTS.testnet : CCTP_CONTRACTS.mainnet;
}

export function padAddressToBytes32(address: string): `0x${string}` {
  return `0x000000000000000000000000${address.slice(2).toLowerCase()}`;
}

export function formatUsdc(amount: bigint): string {
  const n = Number(amount) / 1_000_000;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function parseUsdc(amount: string): bigint {
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return 0n;
  return BigInt(Math.round(n * 1_000_000));
}
