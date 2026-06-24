"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";

import type { DashboardData } from "@/lib/chain-events-format";

export function useChainEventsDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;

  const query = useQuery({
    queryKey: ["chain-events-dashboard", address],
    enabled: Boolean(isConnected && isSepolia && address),
    queryFn: async () => {
      const response = await fetch(`/api/chain-events/dashboard?address=${address}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as DashboardData;
    },
    refetchOnWindowFocus: false,
  });

  return {
    address,
    isConnected,
    isSepolia,
    ...query,
  };
}
