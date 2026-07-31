"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient, useBalance, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ChainSelector from "@/components/ChainSelector";
import BridgeProgress from "@/components/BridgeProgress";
import { useBridge, fetchFeeQuote, computeMaxFee, FeeQuote } from "@/hooks/useBridge";
import { USDC_ADDRESSES, parseUsdc, formatUsdc, CCTP_DOMAINS, TESTNET_CHAIN_IDS, arcTestnet, arcMainnet } from "@/lib/config";
import { ALL_CHAINS_MAP } from "@/lib/chainMap";

export default function BridgeForm() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [fromChain, setFromChain] = useState<number | null>(null);
  const [toChain, setToChain] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [fast, setFast] = useState(true);
  const [feeQuote, setFeeQuote] = useState<FeeQuote | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);

  const { step, statusMsg, currentTx, bridge, reset } = useBridge();

  // Auto-fill recipient with connected wallet
  useEffect(() => {
    if (address && !useCustomRecipient) {
      setRecipient(address);
    }
  }, [address, useCustomRecipient]);

  // Auto-set fromChain to connected chain
  useEffect(() => {
    if (chainId && CCTP_DOMAINS[chainId] !== undefined) {
      setFromChain(chainId);
    }
  }, [chainId]);

  // USDC balance on source chain
  const { data: usdcBalance } = useBalance({
    address,
    token: fromChain ? USDC_ADDRESSES[fromChain] : undefined,
    chainId: fromChain ?? undefined,
    query: { enabled: !!address && !!fromChain },
  });

  // Live fee quote
  useEffect(() => {
    if (!fromChain || !toChain || fromChain === toChain) {
      setFeeQuote(null);
      return;
    }
    const srcDomain = CCTP_DOMAINS[fromChain];
    const dstDomain = CCTP_DOMAINS[toChain];
    if (srcDomain === undefined || dstDomain === undefined) return;

    const isTest = TESTNET_CHAIN_IDS.includes(fromChain);

    setFeeLoading(true);
    fetchFeeQuote(srcDomain, dstDomain, isTest)
      .then(setFeeQuote)
      .finally(() => setFeeLoading(false));
  }, [fromChain, toChain]);

  // Swap chains
  const swapChains = () => {
    const tmp = fromChain;
    setFromChain(toChain);
    setToChain(tmp);
  };

  // Max amount
  const setMax = () => {
    if (usdcBalance) setAmount(usdcBalance.formatted);
  };

  // Fee display
  const amountBn = parseUsdc(amount);
  const maxFeeBn = fast ? computeMaxFee(amountBn, feeQuote) : 0n;
  const youReceive = amountBn > maxFeeBn ? amountBn - maxFeeBn : amountBn;

  const needsChainSwitch = isConnected && chainId !== fromChain && fromChain !== null;
  const isValidAmount = amountBn > 0n;
  const isValidChains = fromChain !== null && toChain !== null && fromChain !== toChain;
  const isValidRecipient = recipient.startsWith("0x") && recipient.length === 42;
  const canBridge =
    isConnected &&
    !needsChainSwitch &&
    isValidAmount &&
    isValidChains &&
    isValidRecipient &&
    step === "idle";

  const handleBridge = useCallback(async () => {
    if (!walletClient || !fromChain || !toChain) return;
    await bridge({ walletClient, fromChainId: fromChain, toChainId: toChain, amount, recipient, fast });
  }, [walletClient, fromChain, toChain, amount, recipient, fast, bridge]);

  const isDone = step === "done";
  const isError = step === "error";
  const isActive = !["idle", "done", "error"].includes(step);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Arc Bridge</h1>
          <p className="text-sm text-gray-500 mt-0.5">Native USDC · Powered by CCTP V2</p>
        </div>
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus="avatar"
        />
      </div>

      {/* Main card */}
      <div className="bg-arc-dark/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">

        {/* Chain selectors */}
        <div className="space-y-3">
          <ChainSelector
            label="From"
            value={fromChain}
            onChange={setFromChain}
            disabledId={toChain}
          />

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapChains}
              className="group w-9 h-9 rounded-xl bg-arc-surface border border-white/10 flex items-center justify-center hover:border-arc-accent/50 hover:bg-arc-surface/80 transition-all"
              title="Swap chains"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-arc-accent group-hover:rotate-180 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <ChainSelector
            label="To"
            value={toChain}
            onChange={setToChain}
            disabledId={fromChain}
          />
        </div>

        {/* Amount input */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-arc-accent uppercase tracking-wide">
              Amount
            </label>
            {usdcBalance && (
              <button
                type="button"
                onClick={setMax}
                className="text-xs text-gray-500 hover:text-arc-accent transition-colors"
              >
                Balance: {parseFloat(usdcBalance.formatted).toFixed(4)} USDC · <span className="underline">MAX</span>
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-arc-surface border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-arc-accent/50 pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
              USDC
            </span>
          </div>
        </div>

        {/* Recipient */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-arc-accent uppercase tracking-wide">
              Recipient
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomRecipient}
                onChange={(e) => {
                  setUseCustomRecipient(e.target.checked);
                  if (!e.target.checked && address) setRecipient(address);
                }}
                className="w-3 h-3 rounded accent-arc-blue"
              />
              <span className="text-xs text-gray-500">Custom address</span>
            </label>
          </div>
          {useCustomRecipient ? (
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-arc-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-arc-accent/50 font-mono"
            />
          ) : (
            <div className="bg-arc-surface border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-400 font-mono truncate">
              {recipient || "Connect wallet"}
            </div>
          )}
        </div>

        {/* Transfer mode toggle */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Transfer speed:</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              type="button"
              onClick={() => setFast(true)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${fast ? "bg-arc-blue text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              ⚡ Fast (~20s)
            </button>
            <button
              type="button"
              onClick={() => setFast(false)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!fast ? "bg-arc-blue text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              🐢 Standard (FREE)
            </button>
          </div>
        </div>

        {/* Fee summary */}
        {isValidAmount && isValidChains && (
          <div className="mt-4 bg-arc-surface/50 border border-white/5 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>You send</span>
              <span className="text-white font-medium">{formatUsdc(amountBn)} USDC</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Bridge fee {feeLoading ? "(loading...)" : ""}</span>
              <span className={maxFeeBn === 0n ? "text-green-400 font-medium" : "text-white"}>
                {fast
                  ? feeQuote
                    ? `~${formatUsdc(maxFeeBn)} USDC`
                    : "—"
                  : "Free 🎉"}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span className="text-gray-300 font-semibold">You receive</span>
              <span className="text-green-400 font-semibold">{formatUsdc(youReceive)} USDC</span>
            </div>
          </div>
        )}

        {/* Arc testnet notice */}
        {(fromChain === arcTestnet.id || toChain === arcTestnet.id) && (
          <div className="mt-3 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
            ⚠️ <strong>Arc Testnet</strong> — use test USDC from{" "}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline">
              faucet.circle.com
            </a>. No real value.
          </div>
        )}

        {/* Arc mainnet live notice */}
        {(fromChain === arcMainnet.id || toChain === arcMainnet.id) && fromChain !== arcTestnet.id && toChain !== arcTestnet.id && (
          <div className="mt-3 text-xs text-green-400/80 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
            🌐 <strong>Arc Mainnet</strong> — CCTP is live on Arc. Real USDC, real value.
          </div>
        )}

        {/* Real value notice (non-Arc mainnet pairs) */}
        {fromChain && toChain && !TESTNET_CHAIN_IDS.includes(fromChain) && !TESTNET_CHAIN_IDS.includes(toChain) && fromChain !== arcMainnet.id && toChain !== arcMainnet.id && (
          <div className="mt-3 text-xs text-blue-400/80 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
            💡 This will bridge <strong>real USDC</strong> between mainnet chains. Double-check amounts.
          </div>
        )}

        {/* Action button */}
        <div className="mt-5">
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : needsChainSwitch && fromChain ? (
            <button
              type="button"
              onClick={() => switchChain({ chainId: fromChain })}
              className="w-full py-3.5 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
            >
              Switch to {ALL_CHAINS_MAP[fromChain] ?? `Chain ${fromChain}`}
            </button>
          ) : isDone ? (
            <button
              type="button"
              onClick={reset}
              className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
            >
              ✓ Bridge another
            </button>
          ) : isError ? (
            <button
              type="button"
              onClick={reset}
              className="w-full py-3.5 rounded-2xl bg-red-500/80 hover:bg-red-500 text-white font-bold text-sm transition-colors"
            >
              Try again
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBridge}
              disabled={!canBridge || isActive}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all
                ${canBridge && !isActive
                  ? "bg-arc-blue hover:bg-arc-blue/80 text-white shadow-lg shadow-arc-blue/20"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"}
              `}
            >
              {isActive ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Bridging...
                </span>
              ) : "Bridge USDC →"}
            </button>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      <BridgeProgress
        step={step}
        statusMsg={statusMsg}
        burnTxHash={currentTx.burnTxHash}
        mintTxHash={currentTx.mintTxHash}
        fromChainId={fromChain ?? undefined}
        toChainId={toChain ?? undefined}
      />
    </div>
  );
}
