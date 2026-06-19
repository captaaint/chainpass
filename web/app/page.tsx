"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  LogOut,
  PlugZap,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { sepolia } from "wagmi/chains";

import {
  chainInviteAbi,
  chainInviteAddress,
  chainInviteChainId,
  hasChainInviteAddress,
} from "@/lib/contract";

function shortenAddress(address?: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();

  const isSepolia = chainId === sepolia.id;
  const injectedConnector = connectors[0];

  const {
    data: eventCounter,
    error: eventCounterError,
    isLoading: isEventCounterLoading,
    refetch,
  } = useReadContract({
    address: chainInviteAddress,
    abi: chainInviteAbi,
    functionName: "eventCounter",
    chainId: chainInviteChainId,
    query: {
      enabled: hasChainInviteAddress,
    },
  });

  const status = useMemo(() => {
    if (!isConnected) {
      return {
        label: "Wallet nincs csatlakoztatva",
        detail: "MetaMask csatlakoztatása szükséges az irasi muveletekhez.",
        tone: "neutral",
      };
    }

    if (!isSepolia) {
      return {
        label: "Rossz halozat",
        detail: "Valts Sepolia testnetre, hogy a deployolt contractot lasd.",
        tone: "warning",
      };
    }

    return {
      label: "Sepolia kapcsolat aktiv",
      detail: "A wallet es a contract ugyanazon a testneten vannak.",
      tone: "success",
    };
  }, [isConnected, isSepolia]);

  return (
    <main className="min-h-screen px-4 py-6 text-[#1d2527] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d8d2c6] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5f6f52]">
              ChainInvite
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1d2527] md:text-3xl">
              Event check-in console
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-medium">
                  <Wallet size={17} aria-hidden="true" />
                  {shortenAddress(address)}
                </span>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
                  title="Wallet disconnect"
                >
                  <LogOut size={17} aria-hidden="true" />
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!injectedConnector || isConnectPending}
                onClick={() => injectedConnector && connect({ connector: injectedConnector })}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#1d6f68] px-4 text-sm font-semibold text-white transition hover:bg-[#15534e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlugZap size={17} aria-hidden="true" />
                {isConnectPending ? "Connecting" : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        <section className="grid min-w-0 gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0 rounded-md border border-[#d8d2c6] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#5f6f52]">Network status</p>
                <h2 className="mt-2 text-xl font-semibold">{status.label}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c6763]">
                  {status.detail}
                </p>
              </div>
              {status.tone === "success" ? (
                <CheckCircle2 className="shrink-0 text-[#1d7b4f]" size={24} aria-hidden="true" />
              ) : (
                <AlertTriangle className="shrink-0 text-[#b6652b]" size={24} aria-hidden="true" />
              )}
            </div>

            {isConnected && !isSepolia ? (
              <button
                type="button"
                disabled={isSwitchPending}
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#b6652b] px-4 text-sm font-semibold text-white transition hover:bg-[#8f4d1f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={17} aria-hidden="true" />
                {isSwitchPending ? "Switching" : "Switch to Sepolia"}
              </button>
            ) : null}
          </div>

          <div className="min-w-0 rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Contract</p>
            <div className="mt-3 break-all rounded-md bg-[#f6f4ee] p-3 font-mono text-xs leading-5 text-[#34413f]">
              {chainInviteAddress}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(chainInviteAddress)}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
                title="Copy contract address"
              >
                <Copy size={16} aria-hidden="true" />
                Copy
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${chainInviteAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Etherscan
              </a>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 md:grid-cols-3">
          <div className="min-w-0 rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Created events</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-semibold">
                {isEventCounterLoading ? "..." : eventCounter?.toString() ?? "0"}
              </span>
              <span className="pb-1 text-sm text-[#5c6763]">on-chain</span>
            </div>
            {eventCounterError ? (
              <p className="mt-3 text-sm leading-6 text-[#a53e2f]">
                Contract read failed. Check the RPC endpoint and Sepolia availability.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
              title="Refresh event count"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="min-w-0 rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Target network</p>
            <p className="mt-4 text-2xl font-semibold">Sepolia</p>
            <p className="mt-2 text-sm text-[#5c6763]">Chain ID {chainInviteChainId}</p>
          </div>

          <div className="min-w-0 rounded-md border border-[#d8d2c6] bg-white p-5">
            <p className="text-sm font-semibold text-[#5f6f52]">Wallet state</p>
            <p className="mt-4 text-2xl font-semibold">
              {isConnected ? "Connected" : "Disconnected"}
            </p>
            <p className="mt-2 break-all text-sm text-[#5c6763]">
              {isConnected ? address : "No account selected"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
