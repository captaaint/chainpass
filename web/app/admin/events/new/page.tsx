"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarPlus, RefreshCw } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { PageHeader } from "@/components/page-header";
import { TransactionStatus } from "@/components/transaction-status";
import { chainInviteAbi, chainInviteAddress } from "@/lib/contract";

function toUnixSeconds(value: string) {
  return BigInt(Math.floor(new Date(value).getTime() / 1000));
}

export default function NewEventPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({ hash, chainId: sepolia.id });

  const isSepolia = chainId === sepolia.id;

  const canSubmit = useMemo(() => {
    return (
      isConnected &&
      isSepolia &&
      name.trim().length > 0 &&
      startTime !== "" &&
      !isPending &&
      !isConfirming
    );
  }, [isConnected, isSepolia, name, startTime, isPending, isConfirming]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Event name is required.");
      return;
    }

    if (!startTime) {
      setFormError("Start time is required.");
      return;
    }

    if (!isSepolia) {
      setFormError("Switch your wallet to Sepolia before creating an event.");
      return;
    }

    writeContract({
      address: chainInviteAddress,
      abi: chainInviteAbi,
      functionName: "createEvent",
      args: [name.trim(), description.trim(), toUnixSeconds(startTime)],
      chainId: sepolia.id,
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <PageHeader eyebrow="Management" title="Create event" />

        <Link
          href="/"
          className="inline-flex w-fit min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to console
        </Link>

        {isConnected && !isSepolia ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d8d2c6] bg-white p-4 text-sm">
            <p className="flex items-center gap-2 text-[#a53e2f]">
              <AlertTriangle size={16} aria-hidden="true" />
              Wallet is on the wrong network.
            </p>
            <button
              type="button"
              disabled={isSwitchPending}
              onClick={() => switchChain({ chainId: sepolia.id })}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#b6652b] px-3 text-sm font-semibold text-white transition hover:bg-[#8f4d1f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} aria-hidden="true" />
              {isSwitchPending ? "Switching" : "Switch to Sepolia"}
            </button>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-md border border-[#d8d2c6] bg-white p-5"
        >
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 rounded-md border border-[#c8c0b4] px-3 font-normal outline-none transition focus:border-[#1d6f68]"
              placeholder="Launch party"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-11 rounded-md border border-[#c8c0b4] px-3 font-normal outline-none transition focus:border-[#1d6f68]"
              placeholder="Community event"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Start time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="min-h-11 rounded-md border border-[#c8c0b4] px-3 font-normal outline-none transition focus:border-[#1d6f68]"
            />
          </label>

          {formError ? <p className="text-sm text-[#a53e2f]">{formError}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarPlus size={17} aria-hidden="true" />
            {isPending || isConfirming ? "Creating" : "Create event"}
          </button>
        </form>

        <TransactionStatus
          hash={hash}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          error={error}
        />
      </div>
    </main>
  );
}
