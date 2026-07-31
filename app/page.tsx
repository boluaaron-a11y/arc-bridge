import BridgeForm from "@/components/BridgeForm";
import TxHistory from "@/components/TxHistory";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0D1B2F] via-[#0D1B2F] to-[#19354D] px-4 py-10">
      {/* Background accent circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-[600px] h-[600px] bg-arc-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        <BridgeForm />
        <TxHistory />

        {/* Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-gray-600">
            Powered by{" "}
            <a
              href="https://developers.circle.com/cctp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-arc-accent transition-colors"
            >
              Circle CCTP V2
            </a>
            {" "}· Native USDC · No wrapped tokens
          </p>
          <p className="text-xs text-gray-700">
            Arc mainnet CCTP is live — bridge to/from Arc today
          </p>
        </div>
      </div>
    </main>
  );
}
