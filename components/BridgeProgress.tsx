"use client";

import { BridgeStep } from "@/hooks/useBridge";

const STEPS: { key: BridgeStep; label: string; icon: string }[] = [
  { key: "approving", label: "Approve USDC", icon: "✅" },
  { key: "burning",   label: "Burn on Source", icon: "🔥" },
  { key: "attesting", label: "Waiting for Attestation", icon: "🔍" },
  { key: "minting",   label: "Mint on Destination", icon: "💎" },
  { key: "done",      label: "Complete!", icon: "🎉" },
];

const ORDER: BridgeStep[] = ["approving", "burning", "attesting", "minting", "done"];

interface Props {
  step: BridgeStep;
  statusMsg: string;
  burnTxHash?: string;
  mintTxHash?: string;
  fromChainId?: number;
  toChainId?: number;
}

function explorerLink(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    8453: "https://basescan.org/tx/",
    42161: "https://arbiscan.io/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    137: "https://polygonscan.com/tx/",
    43114: "https://snowtrace.io/tx/",
    59144: "https://lineascan.build/tx/",
    130: "https://uniscan.xyz/tx/",
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

export default function BridgeProgress({ step, statusMsg, burnTxHash, mintTxHash, fromChainId, toChainId }: Props) {
  if (step === "idle") return null;

  const currentIdx = ORDER.indexOf(step);
  const isError = step === "error";

  return (
    <div className="mt-4 bg-arc-dark/60 border border-white/10 rounded-2xl p-5">
      {isError ? (
        <div className="flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="text-red-400 font-semibold">Bridge failed</p>
            <p className="text-sm text-gray-400 mt-1">{statusMsg}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {STEPS.map((s, i) => {
              const idx = ORDER.indexOf(s.key);
              const isPast = idx < currentIdx;
              const isCurrent = s.key === step;
              const isFuture = idx > currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                    ${isPast ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                      isCurrent ? "bg-arc-blue/30 text-white border border-arc-accent animate-pulse" :
                      "bg-white/5 text-gray-600 border border-white/5"}
                  `}>
                    {isPast ? "✓" : isCurrent ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-sm ${isPast ? "text-green-400" : isCurrent ? "text-white font-medium" : "text-gray-600"}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          <p className="text-xs text-arc-accent bg-arc-surface/50 rounded-lg px-3 py-2">
            {statusMsg || "Processing..."}
          </p>

          {/* Transaction links */}
          {(burnTxHash || mintTxHash) && (
            <div className="mt-3 space-y-1">
              {burnTxHash && fromChainId && (
                <a
                  href={explorerLink(fromChainId, burnTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-arc-accent hover:text-white transition-colors"
                >
                  🔥 Burn tx ↗ <span className="font-mono">{burnTxHash.slice(0, 12)}...</span>
                </a>
              )}
              {mintTxHash && toChainId && (
                <a
                  href={explorerLink(toChainId, mintTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-arc-accent hover:text-white transition-colors"
                >
                  💎 Mint tx ↗ <span className="font-mono">{mintTxHash.slice(0, 12)}...</span>
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
