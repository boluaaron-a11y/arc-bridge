"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
} from "wagmi/chains";
import { arcTestnet, arcMainnet } from "@/lib/config";

export const wagmiConfig = getDefaultConfig({
  appName: "Arc Bridge",
  // Set NEXT_PUBLIC_WC_PROJECT_ID in .env.local — get a free one at cloud.walletconnect.com
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [
    // Mainnet — real USDC
    mainnet,
    base,
    arbitrum,
    optimism,
    polygon,
    avalanche,
    linea,
    unichain,
    sonic,
    // Arc Mainnet — live but no CCTP yet; registered for wallet switching
    arcMainnet as any,
    // Testnet — test USDC
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
    arcTestnet as any,
  ],
  ssr: true,
});
