"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ExternalLink, QrCode, Ticket, UserRound } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useReadContract, useReadContracts } from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  chainEventsAbi,
  chainEventsAddress,
  hasChainEventsAddress,
} from "@/lib/contract";
import {
  type ChainEventRecord,
  formatEthPrice,
  formatEventDate,
  formatEventDateTime,
  getEventStatus,
  getTicketStatus,
  shortenAddress,
} from "@/lib/chain-events-format";
import { Badge, EmptyState, MetricCard, Panel } from "@/components/ui/primitives";

type EventDataTuple = readonly [
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  `0x${string}`,
  boolean,
];
type EventDataObject = {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  ticketPrice: bigint;
  maxSupply: bigint;
  sold: bigint;
  organizer: `0x${string}`;
  treasury: `0x${string}`;
  active: boolean;
};
type EventData = EventDataTuple | EventDataObject;

function parseTokenId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function getEventField<T>(eventData: EventData, index: number, key: keyof EventDataObject) {
  return (
    Array.isArray(eventData)
      ? (eventData as EventDataTuple)[index]
      : (eventData as EventDataObject)[key]
  ) as T;
}

function eventFromData(id: bigint, eventData: EventData): ChainEventRecord {
  return {
    id: id.toString(),
    name: getEventField<string>(eventData, 0, "name"),
    description: getEventField<string>(eventData, 1, "description"),
    startTime: getEventField<bigint>(eventData, 2, "startTime").toString(),
    endTime: getEventField<bigint>(eventData, 3, "endTime").toString(),
    ticketPrice: getEventField<bigint>(eventData, 4, "ticketPrice").toString(),
    maxSupply: getEventField<bigint>(eventData, 5, "maxSupply").toString(),
    sold: getEventField<bigint>(eventData, 6, "sold").toString(),
    organizer: getEventField<`0x${string}`>(eventData, 7, "organizer"),
    treasury: getEventField<`0x${string}`>(eventData, 8, "treasury"),
    active: getEventField<boolean>(eventData, 9, "active"),
  };
}

function getTokenUriHref(tokenUri?: string) {
  if (!tokenUri) {
    return null;
  }

  return tokenUri.startsWith("data:") ? tokenUri : tokenUri;
}

export function TicketDetailContent({ tokenIdParam }: Readonly<{ tokenIdParam: string }>) {
  const tokenId = parseTokenId(tokenIdParam);
  const tokenReads = useReadContracts({
    contracts:
      tokenId === null
        ? []
        : [
            {
              address: chainEventsAddress,
              abi: chainEventsAbi,
              functionName: "ownerOf",
              args: [tokenId],
              chainId: sepolia.id,
            },
            {
              address: chainEventsAddress,
              abi: chainEventsAbi,
              functionName: "tokenEvent",
              args: [tokenId],
              chainId: sepolia.id,
            },
            {
              address: chainEventsAddress,
              abi: chainEventsAbi,
              functionName: "tokenUsed",
              args: [tokenId],
              chainId: sepolia.id,
            },
            {
              address: chainEventsAddress,
              abi: chainEventsAbi,
              functionName: "tokenURI",
              args: [tokenId],
              chainId: sepolia.id,
            },
          ],
    query: {
      enabled: hasChainEventsAddress && tokenId !== null,
      retry: false,
    },
  });
  const owner = tokenReads.data?.[0]?.status === "success" ? tokenReads.data[0].result : null;
  const eventId = tokenReads.data?.[1]?.status === "success" ? tokenReads.data[1].result : null;
  const used = tokenReads.data?.[2]?.status === "success" ? tokenReads.data[2].result : null;
  const tokenUri = tokenReads.data?.[3]?.status === "success" ? tokenReads.data[3].result : null;
  const eventQuery = useReadContract({
    address: chainEventsAddress,
    abi: chainEventsAbi,
    functionName: "getEvent",
    args: eventId === null ? undefined : [eventId],
    chainId: sepolia.id,
    query: {
      enabled: hasChainEventsAddress && eventId !== null,
      retry: false,
    },
  });
  const event = useMemo(
    () => (eventId !== null && eventQuery.data ? eventFromData(eventId, eventQuery.data as EventData) : null),
    [eventId, eventQuery.data],
  );
  const tokenUriHref = getTokenUriHref(tokenUri ?? undefined);
  const qrPayload =
    eventId !== null && tokenId !== null
      ? JSON.stringify(
          {
            version: "chainpass-events-v1",
            eventId: eventId.toString(),
            tokenId: tokenId.toString(),
          },
          null,
          2,
        )
      : "";
  const qrCodeQuery = useQuery({
    queryKey: ["chain-events-ticket-qr", eventId?.toString(), tokenId?.toString()],
    enabled: qrPayload.length > 0,
    queryFn: () =>
      QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 240,
      }),
    refetchOnWindowFocus: false,
  });

  if (!hasChainEventsAddress) {
    return (
      <Panel className="p-8">
        <EmptyState
          title="Contract not configured"
          detail="Set NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS to read ticket details."
        />
      </Panel>
    );
  }

  if (tokenId === null) {
    return (
      <Panel className="p-8">
        <EmptyState title="Invalid token ID" detail="The ticket route must contain a numeric token ID." />
      </Panel>
    );
  }

  if (tokenReads.isLoading || eventQuery.isLoading) {
    return (
      <Panel className="p-8">
        <EmptyState title="Loading ticket" detail="Reading ticket ownership and event metadata from Sepolia." />
      </Panel>
    );
  }

  if (tokenReads.isError || !owner || eventId === null || used === null || !event) {
    return (
      <Panel className="p-8">
        <EmptyState
          title="Ticket not found"
          detail="The contract did not return ownership, event, or metadata for this token."
        />
      </Panel>
    );
  }

  const eventStatus = getEventStatus(event);
  const ticketStatus = getTicketStatus({ used, event });

  return (
    <section className="grid gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(360px,.9fr)]">
      <div className="grid content-start gap-7">
        <Panel className="p-8 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="ce-label uppercase text-[var(--ce-on-surface-variant)]">
                ChainEvents Ticket #{tokenId.toString()}
              </p>
              <h1 className="mt-3 text-[34px] font-bold leading-[42px] tracking-[-0.02em]">
                {event.name}
              </h1>
            </div>
            <Badge tone={ticketStatus.tone}>{ticketStatus.label}</Badge>
          </div>
          <p className="mt-8 max-w-5xl text-lg leading-8">{event.description}</p>
          <div className="mt-8 flex flex-wrap gap-6 text-base text-[var(--ce-on-surface-variant)]">
            <span className="inline-flex items-center gap-3">
              <CalendarDays size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
              {formatEventDate(event.startTime, event.endTime)}
            </span>
            <span className="inline-flex items-center gap-3">
              <UserRound size={22} aria-hidden="true" className="text-[var(--ce-secondary)]" />
              Owner {shortenAddress(owner)}
            </span>
          </div>
        </Panel>

        <Panel emphasis="strong" className="p-7">
          <h2 className="text-2xl font-semibold">Ticket Details</h2>
          <dl className="mt-6 grid gap-5 text-sm md:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-4">
              <dt className="text-[var(--ce-on-surface-variant)]">Token ID</dt>
              <dd className="ce-label">#{tokenId.toString()}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-4">
              <dt className="text-[var(--ce-on-surface-variant)]">Owner</dt>
              <dd className="ce-label">{shortenAddress(owner)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-4">
              <dt className="text-[var(--ce-on-surface-variant)]">Check-in</dt>
              <dd className="ce-label">{used ? "Used" : "Unused"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--ce-outline-variant)] pb-4 md:border-b">
              <dt className="text-[var(--ce-on-surface-variant)]">Starts</dt>
              <dd className="ce-label text-right">{formatEventDateTime(event.startTime)}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white px-4 text-sm font-semibold transition hover:border-[var(--ce-outline)]"
            >
              View Event <Ticket size={16} aria-hidden="true" />
            </Link>
            <a
              href={`https://sepolia.etherscan.io/token/${chainEventsAddress}?a=${tokenId.toString()}`}
              target="_blank"
              rel="noreferrer"
              className="ce-label inline-flex min-h-11 items-center justify-center gap-2 text-[var(--ce-secondary)]"
            >
              View on Etherscan <ExternalLink size={14} aria-hidden="true" />
            </a>
            {tokenUriHref ? (
              <a
                href={tokenUriHref}
                target="_blank"
                rel="noreferrer"
                className="ce-label inline-flex min-h-11 items-center justify-center gap-2 text-[var(--ce-secondary)]"
              >
                Token metadata <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Event ID" value={`#${event.id}`} detail="Read from tokenEvent" />
          <MetricCard label="Ticket Price" value={formatEthPrice(event.ticketPrice)} detail="Original event price" />
          <MetricCard label="Event Status" value={eventStatus} detail="Current event window" />
        </div>
      </div>

      <aside className="grid content-start gap-6">
        <Panel className="p-6">
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <QrCode size={24} aria-hidden="true" />
            Ticket QR Code
          </h2>
          <p className="mt-2 text-sm text-[var(--ce-on-surface-variant)]">
            Present this code at event check-in.
          </p>
          <div className="mt-5 flex justify-center">
            <div className="flex min-h-[260px] items-center justify-center rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white p-4">
              {qrCodeQuery.data ? (
                <Image
                  src={qrCodeQuery.data}
                  alt={`QR code for ChainEvents ticket #${tokenId.toString()}`}
                  width={240}
                  height={240}
                  unoptimized
                  className="size-60"
                />
              ) : (
                <span className="ce-label text-[var(--ce-on-surface-variant)]">Generating QR</span>
              )}
            </div>
          </div>
        </Panel>
      </aside>
    </section>
  );
}
