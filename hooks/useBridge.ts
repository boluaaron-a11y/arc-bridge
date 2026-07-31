import { useState, useCallback, useRef } from "react";
import {
  CCTP_DOMAINS,
  USDC_ADDRESSES,
  ERC20_APPROVE_ABI,
  TOKEN_MESSENGER_ABI,
  MESSAGE_TRANSMITTER_ABI,
  getIrisApi,
  getCctpContracts,
  padAddressToBytes32,
  parseUsdc,
  isTestnet,
  arcTestnet,
} from "@/lib/config";
import { encodeFunctionData, createPublicClient, http } from "viem";
import {
  mainnet, base, arbitrum, optimism, polygon, avalanche,
  linea, unichain, sonic, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia,
} from "viem/chains";
import { arcMainnet } from "@/lib/config";

// Map chain IDs to their viem chain objects (needed for createPublicClient)
const CHAIN_BY_ID: Record<number, any> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [polygon.id]: polygon,
  [avalanche.id]: avalanche,
  [linea.id]: linea,
  [unichain.id]: unichain,
  [sonic.id]: sonic,
  [sepolia.id]: sepolia,
  [baseSepolia.id]: baseSepolia,
  [arbitrumSepolia.id]: arbitrumSepolia,
  [optimismSepolia.id]: optimismSepolia,
  [arcTestnet.id]: arcTestnet,
  [arcMainnet.id]: arcMainnet,
};

// RPC URLs by chain ID — used for waitForTransactionReceipt
const RPC_BY_CHAIN: Record<number, string> = {
  [mainnet.id]: "https://eth.llamarpc.com",
  [base.id]: "https://mainnet.base.org",
  [arbitrum.id]: "https://arb1.arbitrum.io/rpc",
  [optimism.id]: "https://mainnet.optimism.io",
  [polygon.id]: "https://polygon-rpc.com",
  [avalanche.id]: "https://api.avax.network/ext/bc/C/rpc",
  [linea.id]: "https://rpc.linea.build",
  [unichain.id]: "https://mainnet.unichain.org",
  [sonic.id]: "https://rpc.soniclabs.com",
  [sepolia.id]: "https://rpc.sepolia.org",
  [baseSepolia.id]: "https://sepolia.base.org",
  [arbitrumSepolia.id]: "https://sepolia-rollup.arbitrum.io/rpc",
  [optimismSepolia.id]: "https://sepolia.optimism.io",
  [arcTestnet.id]: "https://rpc.testnet.arc.io",
  // Arc Mainnet — using Radar's public RPC (confirmed working, chain ID 5042)
  [arcMainnet.id]: "https://radar-api-rpc.up.railway.app",
};

function getPublicClient(chainId: number) {
  const chain = CHAIN_BY_ID[chainId];
  const rpcUrl = RPC_BY_CHAIN[chainId];
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export type BridgeStep =
  | "idle"
  | "approving"
  | "burning"
  | "attesting"
  | "minting"
  | "done"
  | "error";

export interface BridgeTx {
  id: string;
  fromChainId: number;
  toChainId: number;
  amount: string;
  recipient: string;
  approveTxHash?: string;
  burnTxHash?: string;
  mintTxHash?: string;
  step: BridgeStep;
  errorMessage?: string;
  createdAt: number;
}

// Fee quote from Circle Iris API
export interface FeeQuote {
  finalityThreshold: number;
  minimumFee: number; // basis points
  forwardFee?: { med: number };
}

export async function fetchFeeQuote(
  srcDomain: number,
  dstDomain: number,
  isTestnetRoute: boolean
): Promise<FeeQuote | null> {
  const apiBase = isTestnetRoute
    ? "https://iris-api-sandbox.circle.com"
    : "https://iris-api.circle.com";
  try {
    const res = await fetch(
      `${apiBase}/v2/burn/USDC/fees/${srcDomain}/${dstDomain}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer fast (finalityThreshold=1000) over standard (2000)
    const fast = Array.isArray(data)
      ? data.find((f: FeeQuote) => f.finalityThreshold === 1000)
      : null;
    return fast ?? null;
  } catch {
    return null;
  }
}

// Compute maxFee with 20% buffer
export function computeMaxFee(amount: bigint, feeQuote: FeeQuote | null): bigint {
  if (!feeQuote || feeQuote.minimumFee === 0) return 500n; // 0.0005 USDC fallback
  const protocolFee =
    (amount * BigInt(Math.round(feeQuote.minimumFee * 100))) / 1_000_000n;
  return (protocolFee * 120n) / 100n; // 20% buffer
}

// Poll attestation from Iris
async function pollAttestation(
  srcDomain: number,
  txHash: string,
  irisBase: string,
  onProgress: (msg: string) => void
): Promise<{ message: string; attestation: string } | null> {
  const url = `${irisBase}/v2/messages/${srcDomain}?transactionHash=${txHash}`;
  let attempts = 0;
  while (attempts < 120) {
    // ~10 min max
    await new Promise((r) => setTimeout(r, 5000));
    attempts++;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        onProgress(`Waiting for attestation... (${attempts * 5}s)`);
        continue;
      }
      const data = await res.json();
      const msg = data?.messages?.[0];
      if (msg?.status === "complete") {
        return { message: msg.message, attestation: msg.attestation };
      }
      onProgress(`Attesting... ${msg?.status ?? "pending"} (${attempts * 5}s)`);
    } catch {
      // retry
    }
  }
  return null;
}

export function useBridge() {
  const [step, setStep] = useState<BridgeStep>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [currentTx, setCurrentTx] = useState<Partial<BridgeTx>>({});
  const abortRef = useRef(false);

  const bridge = useCallback(
    async (params: {
      walletClient: any; // wagmi wallet client
      fromChainId: number;
      toChainId: number;
      amount: string;
      recipient: string;
      fast: boolean;
    }) => {
      const { walletClient, fromChainId, toChainId, amount, recipient, fast } =
        params;
      abortRef.current = false;

      const srcDomain = CCTP_DOMAINS[fromChainId];
      const dstDomain = CCTP_DOMAINS[toChainId];

      if (srcDomain === undefined || dstDomain === undefined) {
        setStep("error");
        setStatusMsg("Selected chain not supported by CCTP");
        return;
      }

      const usdcSrc = USDC_ADDRESSES[fromChainId];
      const contracts = getCctpContracts(fromChainId);
      const irisBase = getIrisApi(fromChainId);
      const amountBn = parseUsdc(amount);

      if (!usdcSrc) {
        setStep("error");
        setStatusMsg("USDC not configured for this chain");
        return;
      }

      const txBase: Partial<BridgeTx> = {
        id: `${Date.now()}`,
        fromChainId,
        toChainId,
        amount,
        recipient,
        createdAt: Date.now(),
      };
      setCurrentTx(txBase);

      try {
        // ── Step 1: Fetch fee & compute maxFee ─────────────────────────────
        setStep("approving");
        setStatusMsg("Fetching current fees...");
        const isTestnetRoute = isTestnet(fromChainId);
        const feeQuote = await fetchFeeQuote(srcDomain, dstDomain, isTestnetRoute);
        const maxFee = fast ? computeMaxFee(amountBn, feeQuote) : 0n;
        const finalityThreshold = fast ? 1000 : 2000;

        // ── Step 2: Approve ────────────────────────────────────────────────
        setStatusMsg("Approving USDC...");
        const approveData = encodeFunctionData({
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [contracts.tokenMessenger, amountBn + maxFee],
        });

        const approveTxHash = await walletClient.sendTransaction({
          to: usdcSrc,
          data: approveData,
        });

        setCurrentTx((t) => ({ ...t, approveTxHash, step: "approving" }));
        setStatusMsg(`Approval submitted: ${approveTxHash.slice(0, 10)}...`);

        // Wait for approval confirmation on source chain
        const srcPublicClient = getPublicClient(fromChainId);
        await srcPublicClient.waitForTransactionReceipt({ hash: approveTxHash });

        // ── Step 3: Burn ───────────────────────────────────────────────────
        setStep("burning");
        setStatusMsg("Burning USDC on source chain...");

        const mintRecipientBytes32 = padAddressToBytes32(recipient);
        const destCallerBytes32 =
          "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

        const burnData = encodeFunctionData({
          abi: TOKEN_MESSENGER_ABI,
          functionName: "depositForBurn",
          args: [
            amountBn,
            dstDomain,
            mintRecipientBytes32 as `0x${string}`,
            usdcSrc,
            destCallerBytes32,
            maxFee,
            finalityThreshold,
          ],
        });

        const burnTxHash = await walletClient.sendTransaction({
          to: contracts.tokenMessenger,
          data: burnData,
        });

        setCurrentTx((t) => ({ ...t, burnTxHash, step: "burning" }));
        setStatusMsg(`Burn submitted: ${burnTxHash.slice(0, 10)}...`);

        // ── Step 4: Attest ─────────────────────────────────────────────────
        setStep("attesting");
        const attestation = await pollAttestation(
          srcDomain,
          burnTxHash,
          irisBase,
          setStatusMsg
        );

        if (!attestation) {
          setStep("error");
          setStatusMsg("Attestation timed out. Check tx & retry.");
          return;
        }

        setStatusMsg("Attestation received! Minting on destination...");

        // ── Step 5: Mint ───────────────────────────────────────────────────
        setStep("minting");
        const dstContracts = getCctpContracts(toChainId);
        const mintData = encodeFunctionData({
          abi: MESSAGE_TRANSMITTER_ABI,
          functionName: "receiveMessage",
          args: [
            attestation.message as `0x${string}`,
            attestation.attestation as `0x${string}`,
          ],
        });

        const mintTxHash = await walletClient.sendTransaction({
          to: dstContracts.messageTransmitter,
          data: mintData,
        });

        setCurrentTx((t) => ({ ...t, mintTxHash, step: "done" }));
        setStep("done");
        setStatusMsg(`USDC bridged! Mint tx: ${mintTxHash.slice(0, 10)}...`);

        // Save to history
        const historyRaw = localStorage.getItem("arc_bridge_history") ?? "[]";
        const history: BridgeTx[] = JSON.parse(historyRaw);
        history.unshift({
          ...(txBase as BridgeTx),
          approveTxHash,
          burnTxHash,
          mintTxHash,
          step: "done",
        });
        localStorage.setItem(
          "arc_bridge_history",
          JSON.stringify(history.slice(0, 20))
        );
      } catch (err: any) {
        setStep("error");
        setStatusMsg(err?.shortMessage ?? err?.message ?? "Unknown error");
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStep("idle");
    setStatusMsg("");
    setCurrentTx({});
  }, []);

  return { step, statusMsg, currentTx, bridge, reset };
}
