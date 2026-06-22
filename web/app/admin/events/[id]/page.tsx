"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { Address } from "viem";
import { isAddress } from "viem";
import { useParams } from "next/navigation";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import { PageHeader } from "@/components/page-header";
import { TransactionStatus } from "@/components/transaction-status";
import { chainInviteAbi, chainInviteAddress } from "@/lib/contract";
import { formatTimestamp, normalizeAddress } from "@/lib/format";

type GuestInvite = {
  guest: Address;
};

type ScannerUpdate = {
  scanner: Address;
  allowed: boolean;
};

type EventIndexResponse = {
  guests: GuestInvite[];
  scanners: ScannerUpdate[];
  checkedIn: Address[];
};

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const eventId = BigInt(params.id);
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const [guestAddress, setGuestAddress] = useState("");
  const [scannerAddress, setScannerAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestInvite[]>([]);
  const [scanners, setScanners] = useState<ScannerUpdate[]>([]);
  const [checkedInGuests, setCheckedInGuests] = useState<Set<string>>(new Set());
  const [isIndexLoading, setIsIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const {
    data: eventData,
    error: eventError,
    isLoading: isEventLoading,
  } = useReadContract({
    address: chainInviteAddress,
    abi: chainInviteAbi,
    functionName: "getEvent",
    args: [eventId],
    chainId: sepolia.id,
    query: {
      retry: false,
    },
  });

  const {
    data: inviteHash,
    error: inviteError,
    isPending: isInvitePending,
    writeContract: writeInvite,
  } = useWriteContract();
  const {
    isLoading: isInviteConfirming,
    isSuccess: isInviteSuccess,
  } = useWaitForTransactionReceipt({ hash: inviteHash, chainId: sepolia.id });

  const {
    data: scannerHash,
    error: scannerError,
    isPending: isScannerPending,
    writeContract: writeScanner,
  } = useWriteContract();
  const {
    isLoading: isScannerConfirming,
    isSuccess: isScannerSuccess,
  } = useWaitForTransactionReceipt({ hash: scannerHash, chainId: sepolia.id });

  useEffect(() => {
    let cancelled = false;

    async function loadEventIndex() {
      setIsIndexLoading(true);
      setIndexError(null);

      try {
        const response = await fetch(`/api/events/${params.id}?variant=base`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to load event index.");
        }

        if (cancelled) {
          return;
        }

        const body = (await response.json()) as EventIndexResponse;

        setGuests(body.guests);
        setScanners(body.scanners);
        setCheckedInGuests(new Set(body.checkedIn.map((guest) => normalizeAddress(guest))));
      } catch (caught) {
        if (!cancelled) {
          setIndexError(caught instanceof Error ? caught.message : "Failed to load event index.");
        }
      } finally {
        if (!cancelled) {
          setIsIndexLoading(false);
        }
      }
    }

    loadEventIndex();

    return () => {
      cancelled = true;
    };
  }, [params.id, isInviteSuccess, isScannerSuccess]);

  const isOrganizer =
    address && eventData ? normalizeAddress(eventData.organizer) === normalizeAddress(address) : false;
  const isSepolia = chainId === sepolia.id;
  const canWrite = Boolean(isOrganizer && isSepolia);

  function inviteGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!isAddress(guestAddress)) {
      setFormError("Guest address is not a valid wallet address.");
      return;
    }

    if (!isSepolia) {
      setFormError("Switch your wallet to Sepolia before inviting guests.");
      return;
    }

    writeInvite({
      address: chainInviteAddress,
      abi: chainInviteAbi,
      functionName: "inviteGuest",
      args: [eventId, guestAddress],
      chainId: sepolia.id,
    });
  }

  function updateScanner(allowed: boolean) {
    setFormError(null);

    if (!isAddress(scannerAddress)) {
      setFormError("Scanner address is not a valid wallet address.");
      return;
    }

    if (!isSepolia) {
      setFormError("Switch your wallet to Sepolia before updating scanners.");
      return;
    }

    writeScanner({
      address: chainInviteAddress,
      abi: chainInviteAbi,
      functionName: "setScanner",
      args: [eventId, scannerAddress, allowed],
      chainId: sepolia.id,
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader eyebrow="Admin" title={`Event #${params.id}`} />

        <Link
          href="/admin"
          className="inline-flex w-fit min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to admin
        </Link>

        {address && !isSepolia ? (
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

        {isEventLoading ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm text-[#5c6763]">
            <p className="flex items-center gap-2">
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              Loading event
            </p>
          </div>
        ) : null}

        {eventError ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm leading-6 text-[#a53e2f]">
            {eventError.message}
          </div>
        ) : null}

        {eventData ? (
          <section className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
            <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
              <p className="text-sm font-semibold text-[#5f6f52]">Event details</p>
              <h2 className="mt-3 text-2xl font-semibold">{eventData.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5c6763]">{eventData.description}</p>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold">Starts</dt>
                  <dd className="mt-1 text-[#5c6763]">{formatTimestamp(eventData.startTime)}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Organizer</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-[#5c6763]">
                    {eventData.organizer}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Active</dt>
                  <dd className="mt-1 text-[#5c6763]">{eventData.active ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
              <p className="text-sm font-semibold text-[#5f6f52]">Organizer access</p>
              <p className="mt-3 text-xl font-semibold">{isOrganizer ? "Connected" : "Read only"}</p>
              <p className="mt-2 text-sm leading-6 text-[#5c6763]">
                {isOrganizer
                  ? isSepolia
                    ? "This wallet can invite guests and manage scanners."
                    : "Switch this wallet to Sepolia before writing changes."
                  : "Connect the organizer wallet to write changes."}
              </p>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={inviteGuest}
            className="grid gap-3 rounded-md border border-[#d8d2c6] bg-white p-5"
          >
            <p className="text-sm font-semibold text-[#5f6f52]">Invite guest</p>
            <input
              value={guestAddress}
              onChange={(event) => setGuestAddress(event.target.value)}
              className="min-h-11 rounded-md border border-[#c8c0b4] px-3 font-mono text-sm outline-none transition focus:border-[#1d6f68]"
              placeholder="0x..."
            />
            <button
              type="submit"
              disabled={!canWrite || isInvitePending || isInviteConfirming}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={17} aria-hidden="true" />
              {isInvitePending || isInviteConfirming ? "Inviting" : "Invite guest"}
            </button>
          </form>

          <div className="grid gap-3 rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Scanner permissions</p>
            <input
              value={scannerAddress}
              onChange={(event) => setScannerAddress(event.target.value)}
              className="min-h-11 rounded-md border border-[#c8c0b4] px-3 font-mono text-sm outline-none transition focus:border-[#1d6f68]"
              placeholder="0x..."
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canWrite || isScannerPending || isScannerConfirming}
                onClick={() => updateScanner(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck size={17} aria-hidden="true" />
                Allow
              </button>
              <button
                type="button"
                disabled={!canWrite || isScannerPending || isScannerConfirming}
                onClick={() => updateScanner(false)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-4 text-sm font-semibold transition hover:border-[#9d8f7e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Ban size={17} aria-hidden="true" />
                Revoke
              </button>
            </div>
          </div>
        </section>

        {formError ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-4 text-sm text-[#a53e2f]">
            {formError}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          <TransactionStatus
            hash={inviteHash}
            isConfirming={isInviteConfirming}
            isSuccess={isInviteSuccess}
            error={inviteError}
          />
          <TransactionStatus
            hash={scannerHash}
            isConfirming={isScannerConfirming}
            isSuccess={isScannerSuccess}
            error={scannerError}
          />
        </div>

        <section className="rounded-md border border-[#d8d2c6] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#5f6f52]">Invited guests</p>
              <p className="mt-1 text-sm text-[#5c6763]">
                Guest, scanner, and check-in state is served by the cached event index.
              </p>
            </div>
            <span className="rounded-md bg-[#f6f4ee] px-3 py-2 text-sm font-semibold">
              {guests.length} guests
            </span>
          </div>

          {isIndexLoading ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-[#5c6763]">
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              Loading guests
            </p>
          ) : null}

          {indexError ? <p className="mt-5 text-sm text-[#a53e2f]">{indexError}</p> : null}

          {!isIndexLoading && guests.length === 0 ? (
            <p className="mt-5 text-sm text-[#5c6763]">No guests invited yet.</p>
          ) : null}

          <div className="mt-5 grid gap-2">
            {guests.map((guest) => {
              const checkedIn = checkedInGuests.has(normalizeAddress(guest.guest));

              return (
                <div
                  key={guest.guest}
                  className="grid gap-2 rounded-md border border-[#e5ded3] p-3 text-sm md:grid-cols-[1fr_auto]"
                >
                  <span className="break-all font-mono text-xs">{guest.guest}</span>
                  <span
                    className={`inline-flex min-h-8 w-fit items-center gap-2 rounded-md px-3 font-semibold ${
                      checkedIn
                        ? "bg-[#e9f5ee] text-[#1d7b4f]"
                        : "bg-[#f6f4ee] text-[#5c6763]"
                    }`}
                  >
                    {checkedIn ? <BadgeCheck size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                    {checkedIn ? "Checked in" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-[#d8d2c6] bg-white p-5">
          <p className="text-sm font-semibold text-[#5f6f52]">Scanners</p>
          {scanners.length === 0 ? (
            <p className="mt-3 text-sm text-[#5c6763]">No scanner updates yet.</p>
          ) : null}
          <div className="mt-4 grid gap-2">
            {scanners.map((scanner) => (
              <div
                key={scanner.scanner}
                className="grid gap-2 rounded-md border border-[#e5ded3] p-3 text-sm md:grid-cols-[1fr_auto]"
              >
                <span className="break-all font-mono text-xs">{scanner.scanner}</span>
                <span
                  className={`inline-flex min-h-8 w-fit items-center rounded-md px-3 font-semibold ${
                    scanner.allowed
                      ? "bg-[#e9f5ee] text-[#1d7b4f]"
                      : "bg-[#f7e9e5] text-[#a53e2f]"
                  }`}
                >
                  {scanner.allowed ? "Allowed" : "Revoked"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
