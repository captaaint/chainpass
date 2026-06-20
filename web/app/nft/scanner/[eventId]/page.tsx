"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  Loader2,
  Play,
  RefreshCw,
  Square,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { isAddress, type Address } from "viem";
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
import { chainInviteNftAbi, chainInviteNftAddress } from "@/lib/contract-nft";
import { formatTimestamp, shortenAddress } from "@/lib/format";

type ScannerPayload = {
  eventId: bigint;
  guest: Address;
  tokenId: bigint;
};

function parseScannerPayload(raw: string, expectedEventId: bigint): ScannerPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid QR payload: not JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid QR payload.");
  }

  const payload = parsed as { eventId?: unknown; guest?: unknown; tokenId?: unknown };

  if (typeof payload.eventId !== "string" && typeof payload.eventId !== "number") {
    throw new Error("Invalid QR payload: missing eventId.");
  }

  if (typeof payload.guest !== "string" || !isAddress(payload.guest)) {
    throw new Error("Invalid QR payload: guest is not a wallet address.");
  }

  if (typeof payload.tokenId !== "string" && typeof payload.tokenId !== "number") {
    throw new Error("Invalid QR payload: missing tokenId.");
  }

  const eventId = BigInt(payload.eventId);
  const tokenId = BigInt(payload.tokenId);

  if (eventId !== expectedEventId) {
    throw new Error(`QR belongs to event #${eventId.toString()}, not this scanner page.`);
  }

  if (tokenId === 0n) {
    throw new Error("Invalid QR payload: tokenId cannot be zero.");
  }

  return {
    eventId,
    guest: payload.guest,
    tokenId,
  };
}

export default function ScannerPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = BigInt(params.eventId);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedPayload, setScannedPayload] = useState<ScannerPayload | null>(null);

  const isSepolia = chainId === sepolia.id;

  const {
    data: eventData,
    error: eventError,
    isLoading: isEventLoading,
  } = useReadContract({
    address: chainInviteNftAddress,
    abi: chainInviteNftAbi,
    functionName: "getEvent",
    args: [eventId],
    chainId: sepolia.id,
    query: {
      retry: false,
    },
  });

  const {
    data: validInvite,
    isLoading: isValidInviteLoading,
    refetch: refetchValidInvite,
  } = useReadContract({
    address: chainInviteNftAddress,
    abi: chainInviteNftAbi,
    functionName: "isValidToken",
    args: scannedPayload
      ? [eventId, scannedPayload.guest, scannedPayload.tokenId]
      : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(scannedPayload),
      retry: false,
    },
  });

  const {
    data: checkInHash,
    error: checkInError,
    isPending: isCheckInPending,
    writeContract,
  } = useWriteContract();
  const {
    isLoading: isCheckInConfirming,
    isSuccess: isCheckInSuccess,
  } = useWaitForTransactionReceipt({ hash: checkInHash, chainId: sepolia.id });

  const canCheckIn = useMemo(() => {
    return (
      isConnected &&
      isSepolia &&
      Boolean(scannedPayload) &&
      validInvite === true &&
      !isCheckInPending &&
      !isCheckInConfirming
    );
  }, [isCheckInConfirming, isCheckInPending, isConnected, isSepolia, scannedPayload, validInvite]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, []);

  async function startScanner() {
    setScanError(null);
    setScannedPayload(null);

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
      },
      async (decodedText) => {
        try {
          const payload = parseScannerPayload(decodedText, eventId);
          setScannedPayload(payload);
          setScanError(null);

          if (scanner.isScanning) {
            await scanner.stop();
            setIsScannerRunning(false);
          }
        } catch (caught) {
          setScanError(caught instanceof Error ? caught.message : "Invalid QR code.");
        }
      },
      () => undefined,
    );

    setIsScannerRunning(true);
  }

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      await scanner.stop();
    }

    setIsScannerRunning(false);
  }

  function checkInGuest() {
    if (!scannedPayload) {
      setScanError("Scan a valid invite QR before check-in.");
      return;
    }

    if (!isSepolia) {
      setScanError("Switch your wallet to Sepolia before check-in.");
      return;
    }

    if (!validInvite) {
      setScanError("Invite is not valid or has already been used.");
      return;
    }

    writeContract({
      address: chainInviteNftAddress,
      abi: chainInviteNftAbi,
      functionName: "checkIn",
      args: [eventId, scannedPayload.guest, scannedPayload.tokenId],
      chainId: sepolia.id,
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader eyebrow="NFT Scanner" title={`Event #${params.eventId}`} />

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

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Event</p>
            {isEventLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[#5c6763]">
                <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                Loading event
              </p>
            ) : null}
            {eventError ? (
              <p className="mt-4 text-sm leading-6 text-[#a53e2f]">{eventError.message}</p>
            ) : null}
            {eventData ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold">{eventData.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5c6763]">{eventData.description}</p>
                <p className="mt-4 text-sm text-[#5c6763]">
                  Starts {formatTimestamp(eventData.startTime)}
                </p>
              </>
            ) : null}
          </div>

          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#5f6f52]">Camera</p>
                <p className="mt-1 text-sm text-[#5c6763]">Scan a guest invite QR.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isScannerRunning}
                  onClick={startScanner}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1d6f68] px-3 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Play size={16} aria-hidden="true" />
                  Start
                </button>
                <button
                  type="button"
                  disabled={!isScannerRunning}
                  onClick={stopScanner}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Square size={16} aria-hidden="true" />
                  Stop
                </button>
              </div>
            </div>

            <div className="relative mt-5 min-h-[320px] overflow-hidden rounded-md border border-[#d8d2c6] bg-[#f6f4ee]">
              <div id="qr-reader" className="min-h-[320px] w-full" />
              {!isScannerRunning && !scannedPayload ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-[#5c6763]">
                  <Camera size={32} aria-hidden="true" />
                  Camera preview appears here
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Scanned invite</p>
            {scannedPayload ? (
              <div className="mt-4 grid gap-3 text-sm">
                <p>
                  Event <span className="font-semibold">#{scannedPayload.eventId.toString()}</span>
                </p>
                <p>
                  Token <span className="font-semibold">#{scannedPayload.tokenId.toString()}</span>
                </p>
                <p className="break-all font-mono text-xs">{scannedPayload.guest}</p>
                <p className="text-[#5c6763]">
                  {isValidInviteLoading ? "Checking invite..." : null}
                  {validInvite === true ? "Invite is valid." : null}
                  {validInvite === false ? "Invite is invalid or already used." : null}
                </p>
                <button
                  type="button"
                  onClick={() => refetchValidInvite()}
                  className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Recheck
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#5c6763]">No QR scanned yet.</p>
            )}
          </div>

          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Check-in</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {isCheckInSuccess ? "Checked in" : validInvite ? "Ready" : "Waiting"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5c6763]">
              {isCheckInSuccess
                ? `${shortenAddress(scannedPayload?.guest)} has been checked in.`
                : "Only the organizer or an approved scanner can submit check-in."}
            </p>
            <button
              type="button"
              disabled={!canCheckIn}
              onClick={checkInGuest}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BadgeCheck size={17} aria-hidden="true" />
              {isCheckInPending || isCheckInConfirming ? "Checking in" : "Check in guest"}
            </button>
          </div>
        </section>

        {scanError ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-4 text-sm leading-6 text-[#a53e2f]">
            {scanError}
          </div>
        ) : null}

        <TransactionStatus
          hash={checkInHash}
          isConfirming={isCheckInConfirming}
          isSuccess={isCheckInSuccess}
          error={checkInError}
        />
      </div>
    </main>
  );
}
