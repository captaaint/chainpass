"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, BadgeCheck, Loader2, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAccount, useChainId, useReadContract, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import { PageHeader } from "@/components/page-header";
import { chainInviteAbi, chainInviteAddress } from "@/lib/contract";
import { formatTimestamp } from "@/lib/format";

type InviteState = "connect" | "wrong-network" | "valid" | "used" | "missing";

export default function InvitePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = BigInt(params.eventId);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const isSepolia = chainId === sepolia.id;

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
    data: invited,
    isLoading: isInvitedLoading,
  } = useReadContract({
    address: chainInviteAddress,
    abi: chainInviteAbi,
    functionName: "invited",
    args: address ? [eventId, address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: validInvite,
    isLoading: isInviteLoading,
    refetch,
  } = useReadContract({
    address: chainInviteAddress,
    abi: chainInviteAbi,
    functionName: "isValidInvite",
    args: address ? [eventId, address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const state: InviteState = useMemo(() => {
    if (!isConnected) {
      return "connect";
    }

    if (!isSepolia) {
      return "wrong-network";
    }

    if (validInvite) {
      return "valid";
    }

    if (invited && validInvite === false) {
      return "used";
    }

    return "missing";
  }, [invited, isConnected, isSepolia, validInvite]);

  useEffect(() => {
    let cancelled = false;

    async function makeQrCode() {
      if (state !== "valid" || !address) {
        setQrDataUrl(null);
        return;
      }

      const payload = JSON.stringify({
        eventId: params.eventId,
        guest: address,
      });

      const dataUrl = await QRCode.toDataURL(payload, {
        margin: 2,
        scale: 8,
        color: {
          dark: "#1d2527",
          light: "#ffffff",
        },
      });

      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    }

    makeQrCode();

    return () => {
      cancelled = true;
    };
  }, [address, params.eventId, state]);

  const isLoading = isEventLoading || isInvitedLoading || isInviteLoading;

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PageHeader eyebrow="Invite" title={`Event #${params.eventId}`} />

        <Link
          href="/"
          className="inline-flex w-fit min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to console
        </Link>

        {eventError ? (
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5 text-sm leading-6 text-[#a53e2f]">
            {eventError.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Event</p>
            {isEventLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[#5c6763]">
                <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                Loading event
              </p>
            ) : null}
            {eventData ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold">{eventData.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5c6763]">{eventData.description}</p>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold">Starts</dt>
                    <dd className="mt-1 text-[#5c6763]">
                      {formatTimestamp(eventData.startTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Organizer</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-[#5c6763]">
                      {eventData.organizer}
                    </dd>
                  </div>
                </dl>
              </>
            ) : null}
          </div>

          <div className="rounded-md border border-[#d8d2c6] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#5f6f52]">Invite status</p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {state === "valid" ? "Valid invite" : null}
                  {state === "used" ? "Already used" : null}
                  {state === "missing" ? "No invite found" : null}
                  {state === "connect" ? "Connect wallet" : null}
                  {state === "wrong-network" ? "Wrong network" : null}
                </h2>
              </div>
              {state === "valid" ? (
                <BadgeCheck size={26} aria-hidden="true" className="text-[#1d7b4f]" />
              ) : (
                <AlertTriangle size={26} aria-hidden="true" className="text-[#b6652b]" />
              )}
            </div>

            {isLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[#5c6763]">
                <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                Checking invite
              </p>
            ) : null}

            {state === "wrong-network" ? (
              <button
                type="button"
                disabled={isSwitchPending}
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#b6652b] px-4 text-sm font-semibold text-white transition hover:bg-[#8f4d1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} aria-hidden="true" />
                {isSwitchPending ? "Switching" : "Switch to Sepolia"}
              </button>
            ) : null}

            {state === "valid" && qrDataUrl ? (
              <div className="mt-5 grid gap-4">
                <div className="flex w-fit rounded-md border border-[#d8d2c6] bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="Invite QR code" className="h-64 w-64" />
                </div>
                <div className="rounded-md bg-[#f6f4ee] p-3 font-mono text-xs leading-5 text-[#34413f]">
                  {JSON.stringify({ eventId: params.eventId, guest: address })}
                </div>
              </div>
            ) : null}

            {state === "used" ? (
              <p className="mt-4 text-sm leading-6 text-[#5c6763]">
                This wallet was invited, but the invite has already been checked in.
              </p>
            ) : null}

            {state === "missing" ? (
              <p className="mt-4 text-sm leading-6 text-[#5c6763]">
                This connected wallet is not invited to this event.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
