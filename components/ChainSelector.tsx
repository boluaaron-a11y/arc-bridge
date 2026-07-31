"use client";

import { useState } from "react";
import { MAINNET_CHAINS, TESTNET_CHAINS, CCTP_DOMAINS, TESTNET_CHAIN_IDS } from "@/lib/config";

// All available chains for selection
const ALL_CHAINS = [...MAINNET_CHAINS, ...TESTNET_CHAINS];

export interface ChainOption {
  id: number;
  name: string;
  label: string;
  logo: string;
}

function buildOptions(): ChainOption[] {
  return ALL_CHAINS
    .filter((c) => CCTP_DOMAINS[c.chain.id] !== undefined)
    .map((c) => ({
      id: c.chain.id,
      name: c.chain.name,
      label: c.label,
      logo: c.logo,
    }));
}

interface Props {
  label: string;
  value: number | null;
  onChange: (chainId: number) => void;
  disabledId?: number | null;
}

export default function ChainSelector({ label, value, onChange, disabledId }: Props) {
  const options = buildOptions();
  const selected = options.find((o) => o.id === value);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-arc-accent mb-1 uppercase tracking-wide">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-arc-surface border border-white/10 rounded-xl text-white text-sm hover:border-arc-accent/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{selected?.logo ?? "?"}</span>
          <span>{selected?.label ?? "Select chain"}</span>
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-arc-dark border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* Mainnet group */}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest bg-arc-dark sticky top-0">
              🟢 Mainnet (Real USDC)
            </div>
            {options.filter((o) => !TESTNET_CHAIN_IDS.includes(o.id)).map((opt) => (
              <button
                key={opt.id}
                disabled={opt.id === disabledId}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                  ${opt.id === value ? "bg-arc-blue/20 text-white" : "text-gray-300 hover:bg-white/5"}
                  ${opt.id === disabledId ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                <span className="text-base">{opt.logo}</span>
                <span>{opt.label}</span>
                {opt.id === value && <span className="ml-auto text-arc-accent text-xs">✓</span>}
              </button>
            ))}
            {/* Testnet group */}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest bg-arc-dark sticky top-0 border-t border-white/5">
              🧪 Testnet (Test USDC)
            </div>
            {options.filter((o) => TESTNET_CHAIN_IDS.includes(o.id)).map((opt) => (
              <button
                key={opt.id}
                disabled={opt.id === disabledId}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                  ${opt.id === value ? "bg-arc-blue/20 text-white" : "text-gray-300 hover:bg-white/5"}
                  ${opt.id === disabledId ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                <span className="text-base">{opt.logo}</span>
                <span>{opt.label}</span>
                {opt.id === value && <span className="ml-auto text-arc-accent text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
