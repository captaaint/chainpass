import type { Address } from "viem";

export function shortenAddress(address?: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: bigint) {
  const date = new Date(Number(timestamp) * 1000);

  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizeAddress(address: Address) {
  return address.toLowerCase();
}
