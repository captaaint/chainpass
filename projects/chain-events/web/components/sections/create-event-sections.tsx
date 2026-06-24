"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Blocks, CirclePlus, Info, WalletCards } from "lucide-react";
import { decodeEventLog, isAddress, parseEther, type Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { TransactionStatus } from "@/components/transaction-status";
import { Button, Panel, StatusCallout } from "@/components/ui/primitives";
import {
  chainEventsAbi,
  chainEventsAddress,
  hasChainEventsAddress,
} from "@/lib/contract";

const inputClassName =
  "min-h-11 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface)] px-4 text-sm text-[var(--ce-on-surface)] outline-none transition placeholder:text-[#7a8290] focus:border-[var(--ce-secondary)]";

function toUnixSeconds(value: string) {
  return BigInt(Math.floor(new Date(value).getTime() / 1000));
}

function FieldShell({
  label,
  children,
  helper,
}: Readonly<{
  label: string;
  children: ReactNode;
  helper?: ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="ce-label text-[var(--ce-on-surface-variant)]">{label}</span>
      {children}
      {helper ? <span className="ce-label text-[var(--ce-on-surface-variant)]">{helper}</span> : null}
    </label>
  );
}

export function CreateEventForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const { isError: isContractMismatch } = useReadContract({
    address: chainEventsAddress,
    abi: chainEventsAbi,
    functionName: "nextTokenId",
    chainId: sepolia.id,
    query: {
      enabled: hasChainEventsAddress,
      retry: false,
    },
  });
  const {
    data: hash,
    error: writeError,
    isPending: isSignaturePending,
    writeContract,
  } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash, chainId: sepolia.id });
  const navigatedReceiptHash = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSepolia = chainId === sepolia.id;
  const normalizedTreasury = treasuryAddress.trim();
  const canSubmit =
    hasChainEventsAddress &&
    !isContractMismatch &&
    isConnected &&
    isSepolia &&
    !isSignaturePending &&
    !isConfirming;

  const statusError = useMemo(() => {
    if (formError) {
      return new Error(formError);
    }

    return writeError ?? receiptError ?? null;
  }, [formError, receiptError, writeError]);

  useEffect(() => {
    if (!isSuccess || !receipt || navigatedReceiptHash.current === receipt.transactionHash) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["chain-events-dashboard", address] });
    void queryClient.invalidateQueries({ queryKey: ["chain-events-available-events"] });

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: chainEventsAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decodedLog.eventName === "EventCreated") {
          navigatedReceiptHash.current = receipt.transactionHash;
          router.push(`/events/${decodedLog.args.eventId.toString()}`);
          return;
        }
      } catch {
        // Ignore logs from other contracts in the same receipt.
      }
    }
  }, [address, isSuccess, queryClient, receipt, router]);

  function validateForm() {
    if (!hasChainEventsAddress) {
      return "ChainEvents contract address is not configured.";
    }

    if (isContractMismatch) {
      return "Configured address does not match the ChainEvents ABI. Update NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS to a deployed ChainEvents contract.";
    }

    if (!isConnected) {
      return "Connect MetaMask before creating an event.";
    }

    if (!isSepolia) {
      return "Switch to Sepolia before creating an event.";
    }

    if (!name.trim()) {
      return "Event name is required.";
    }

    if (!startTime || !endTime) {
      return "Start and end date are required.";
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return "Enter valid start and end dates.";
    }

    if (endDate.getTime() < startDate.getTime()) {
      return "End date cannot be before start date.";
    }

    let parsedTicketPrice: bigint;
    try {
      parsedTicketPrice = parseEther(ticketPrice.trim());
    } catch {
      return "Enter a valid ETH amount.";
    }

    if (parsedTicketPrice <= BigInt(0)) {
      return "The current contract requires an ETH amount greater than zero.";
    }

    if (!/^\d+$/.test(maxSupply.trim()) || BigInt(maxSupply.trim()) <= BigInt(0)) {
      return "Max pass supply must be a positive whole number.";
    }

    if (!isAddress(normalizedTreasury)) {
      return "Enter a valid treasury wallet address.";
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    writeContract({
      address: chainEventsAddress,
      abi: chainEventsAbi,
      functionName: "createEvent",
      args: [
        name.trim(),
        description.trim(),
        toUnixSeconds(startTime),
        toUnixSeconds(endTime),
        parseEther(ticketPrice.trim()),
        BigInt(maxSupply.trim()),
        normalizedTreasury as Address,
      ],
      chainId: sepolia.id,
    });
  }

  return (
    <Panel className="p-6 md:p-8">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        {!hasChainEventsAddress ? (
          <StatusCallout title="Contract not configured" tone="warning">
            Set NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS before creating on-chain events.
          </StatusCallout>
        ) : null}

        {isContractMismatch ? (
          <StatusCallout title="Contract ABI mismatch" tone="danger">
            The configured address does not expose the current ChainEvents functions. Deploy
            ChainEvents and update NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS plus the deployment block.
          </StatusCallout>
        ) : null}

        {isConnected && !isSepolia ? (
          <StatusCallout title="Wrong network" tone="warning">
            <button
              type="button"
              disabled={isSwitchPending}
              onClick={() => switchChain({ chainId: sepolia.id })}
              className="font-semibold text-[var(--ce-warning)] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSwitchPending ? "Switching to Sepolia" : "Switch to Sepolia"}
            </button>
          </StatusCallout>
        ) : null}

        <FieldShell label="Event Name">
          <input
            className={inputClassName}
            placeholder="e.g. Web3 Builders Summit"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FieldShell>
        <FieldShell label="Description">
          <textarea
            placeholder="Describe who can attend and what access this pass grants..."
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-32 resize-y rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface)] px-4 py-3 text-sm leading-6 text-[var(--ce-on-surface)] outline-none transition placeholder:text-[#7a8290] focus:border-[var(--ce-secondary)]"
          />
        </FieldShell>
        <div className="grid gap-6 md:grid-cols-2">
          <FieldShell label="Start Date & Time">
            <input
              className={inputClassName}
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </FieldShell>
          <FieldShell label="End Date & Time">
            <input
              className={inputClassName}
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </FieldShell>
          <FieldShell
            label="Contract ETH Amount"
            helper="The current deployed ABI requires this value to be greater than zero."
          >
            <input
              className={inputClassName}
              inputMode="decimal"
              placeholder="0.0001"
              value={ticketPrice}
              onChange={(event) => setTicketPrice(event.target.value)}
            />
          </FieldShell>
          <FieldShell label="Max Pass Supply">
            <input
              className={inputClassName}
              inputMode="numeric"
              placeholder="500"
              value={maxSupply}
              onChange={(event) => setMaxSupply(event.target.value)}
            />
          </FieldShell>
        </div>
        <FieldShell
          label="Treasury Wallet Address"
          helper="Kept for compatibility with the current contract."
        >
          <input
            className={inputClassName}
            placeholder="0x..."
            value={treasuryAddress}
            onChange={(event) => setTreasuryAddress(event.target.value)}
          />
        </FieldShell>

        <TransactionStatus
          hash={hash}
          isConfirming={isConfirming || isSignaturePending}
          isSuccess={isSuccess}
          error={statusError}
        />

        <div className="grid gap-3 border-t border-[var(--ce-outline-variant)] pt-6">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="min-h-14 w-full text-lg white"
          >
            <CirclePlus size={22} aria-hidden="true" color="currentColor" />
            {isSignaturePending ? "Confirm in Wallet" : isConfirming ? "Creating Event" : "Create Event"}
          </Button>
          {!isConnected ? (
            <p className="ce-label text-center text-[var(--ce-on-surface-variant)]">
              Connect MetaMask from the header to submit this transaction.
            </p>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

export function CreateEventAside() {
  return (
    <aside className="grid content-start gap-6">
      <Panel className="bg-[var(--ce-surface-container-high)] p-6">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <Info size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
          On-Chain Logistics
        </h2>
        <div className="mt-6 grid gap-6 text-sm leading-6 text-[var(--ce-on-surface-variant)]">
          <p className="grid grid-cols-[28px_1fr] gap-3">
            <Blocks size={20} aria-hidden="true" />
            <span>The configured contract records the event, organizer, timing, and pass supply.</span>
          </p>
          <p className="grid grid-cols-[28px_1fr] gap-3">
            <WalletCards size={20} aria-hidden="true" />
            <span>The connected wallet becomes the event organizer for scanner and event controls.</span>
          </p>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="h-40 bg-[radial-gradient(circle_at_70%_35%,rgba(87,223,254,.6),transparent_22%),linear-gradient(135deg,#07111f,#153d47_58%,#05080e)]" />
        <div className="p-5">
          <p className="ce-label font-semibold text-[var(--ce-on-surface)]">Preview Mode</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ce-on-surface-variant)]">
            Your event access page will be generated automatically based on these parameters.
          </p>
        </div>
      </Panel>
    </aside>
  );
}
