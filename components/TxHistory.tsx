"use client";

import { useEffect, useState } from "react";
import { BridgeTx } from "@/hooks/useBridge";
import { ALL_CHAINS_MAP } from "@/lib/chainMap";

function explorerLink(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/", 8453: "https://basescan.org/tx/",
    42161: "https://arbiscan.io/tx/", 10: "https://optimistic.etherscan.io/tx/",
    137: "https://polygonscan.com/tx/", 43114: "https://snowtrace.io/tx/",
    59144: "https://lineascan.build/tx/", 130: "https://uniscan.xyz/tx/",
    146: "https://sonicscan.org/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    84532: "https://base-sepolia.blockscout.com/tx/",
    421614: "https://sepolia.arbiscan.io/tx/",
    11155420: "https://sepolia-optimism.etherscan.io/tx/",
    5042002: "https://explorer.testnet.arc.io/tx/",
    5042: "https://explorer.arc.io/tx/",
  };
  return (explorers[chainId] ?? "#") + txHash;
}

export default function TxHistory() {
  const [history, setHistory] = useState<BridgeTx[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("arc_bridge_history") ?? "[]";
      setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  if (history.length === 0) return null;

  const chainName = (id: number) => ALL_CHAINS_MAP[id] ?? `Chain ${id}`;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Recent Transactions
      </h2>
      <div className="space-y-2">
        {history.map((tx) => (
          <div
            key={tx.id}
            className="bg-arc-dark/60 border border-white/5 rounded-xl p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {tx.amount} USDC
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                ${tx.step === "done" ? "bg-green-500/20 text-green-400" :
                  tx.step === "error" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"}`}>
                {tx.step === "done" ? "✓ Complete" : tx.step === "error" ? "✗ Failed" : "⏳ Pending"}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              {chainName(tx.fromChainId)} → {chainName(tx.toChainId)}
            </p>
            <div className="flex gap-3 mt-1.5">
              {tx.burnTxHash && (
                <a href={explorerLink(tx.fromChainId, tx.burnTxHash)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-arc-accent hover:text-white">
                  Burn ↗
                </a>
              )}
              {tx.mintTxHash && (
                <a href={explorerLink(tx.toChainId, tx.mintTxHash)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-arc-accent hover:text-white">
                  Mint ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
