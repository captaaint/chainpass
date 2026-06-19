import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function TransactionStatus({
  hash,
  isConfirming,
  isSuccess,
  error,
}: {
  hash?: `0x${string}`;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
}) {
  if (!hash && !isConfirming && !isSuccess && !error) {
    return null;
  }

  return (
    <div className="rounded-md border border-[#d8d2c6] bg-white p-4 text-sm">
      {isConfirming ? (
        <p className="flex items-center gap-2 text-[#5c6763]">
          <Loader2 size={16} aria-hidden="true" className="animate-spin" />
          Transaction pending
        </p>
      ) : null}
      {isSuccess ? (
        <p className="flex items-center gap-2 text-[#1d7b4f]">
          <CheckCircle2 size={16} aria-hidden="true" />
          Transaction confirmed
        </p>
      ) : null}
      {error ? (
        <p className="flex items-start gap-2 leading-6 text-[#a53e2f]">
          <AlertTriangle size={16} aria-hidden="true" className="mt-1 shrink-0" />
          {error.message}
        </p>
      ) : null}
      {hash ? (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all font-mono text-xs text-[#1d6f68]"
        >
          {hash}
        </a>
      ) : null}
    </div>
  );
}
