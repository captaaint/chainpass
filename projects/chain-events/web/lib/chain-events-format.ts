import { formatEther, type Address } from "viem";

export type ChainEventRecord = {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  ticketPrice: string;
  maxSupply: string;
  sold: string;
  organizer: Address;
  treasury: Address;
  active: boolean;
};

export type TicketRecord = {
  tokenId: string;
  eventId: string;
  owner: Address;
  used: boolean;
  event: ChainEventRecord;
};

export type ScannerAssignmentRecord = {
  eventId: string;
  allowed: boolean;
  event: ChainEventRecord;
};

export type DashboardData = {
  configured: boolean;
  compatible?: boolean;
  error?: string;
  latestBlock?: string;
  fromBlock?: string;
  organizedEvents: ChainEventRecord[];
  tickets: TicketRecord[];
  scannerAssignments: ScannerAssignmentRecord[];
};

export type AvailableEventsData = {
  configured: boolean;
  compatible?: boolean;
  error?: string;
  latestBlock?: string;
  fromBlock?: string;
  serverTime?: string;
  events: ChainEventRecord[];
};

export function shortenAddress(address?: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEventDate(startTime: string, endTime?: string) {
  const start = new Date(Number(startTime) * 1000);
  const end = endTime ? new Date(Number(endTime) * 1000) : undefined;

  if (Number.isNaN(start.getTime())) {
    return "Unknown date";
  }

  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatEventDateTime(value: string) {
  const date = new Date(Number(value) * 1000);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatEthPrice(value: string) {
  return `${formatEther(BigInt(value))} ETH`;
}

export function getEventStatus(event: Pick<ChainEventRecord, "active" | "endTime" | "startTime">) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = Number(event.startTime);
  const endTime = Number(event.endTime);

  if (!event.active) {
    return "Inactive";
  }

  if (now > endTime) {
    return "Ended";
  }

  if (now < startTime) {
    return "Upcoming";
  }

  return "Active";
}
