import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function TransactionStatus({
  hash,
  isConfirming,
  isSuccess,
  error,
}: Readonly<{
  hash?: `0x${string}`;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
}>) {
  if (!hash && !isConfirming && !isSuccess && !error) {
    return null;
  }

  return (
    <div className="rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white p-4 text-sm">
      {isConfirming ? (
        <p className="flex items-center gap-2 text-[var(--ce-on-surface-variant)]">
          <Loader2 size={16} aria-hidden="true" className="animate-spin" />
          Transaction pending
        </p>
      ) : null}
      {isSuccess ? (
        <p className="flex items-center gap-2 text-[var(--ce-success)]">
          <CheckCircle2 size={16} aria-hidden="true" />
          Transaction confirmed
        </p>
      ) : null}
      {error ? (
        <p className="flex items-start gap-2 leading-6 text-[var(--ce-error)]">
          <AlertTriangle size={16} aria-hidden="true" className="mt-1 shrink-0" />
          {error.message}
        </p>
      ) : null}
      {hash ? (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="ce-label mt-2 block break-all text-[var(--ce-secondary)]"
        >
          {hash}
        </a>
      ) : null}
    </div>
  );
}
