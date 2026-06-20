"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, LogOut, PlugZap, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import { shortenAddress } from "@/lib/format";

export function WalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const injectedConnector = connectors[0];
  const isSepolia = chainId === sepolia.id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
      >
        Console
      </Link>
      <Link
        href="/admin"
        className="inline-flex min-h-10 items-center rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
      >
        Admin
      </Link>
      <Link
        href="/nft/admin"
        className="inline-flex min-h-10 items-center rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
      >
        NFT Admin
      </Link>
      <Link
        href="/invite/1"
        className="inline-flex min-h-10 items-center rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
      >
        Invite
      </Link>
      <Link
        href="/scanner/1"
        className="inline-flex min-h-10 items-center rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-semibold transition hover:border-[#9d8f7e]"
      >
        Scanner
      </Link>

      {isConnected && !isSepolia ? (
        <button
          type="button"
          disabled={isSwitchPending}
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#b6652b] px-3 text-sm font-semibold text-white transition hover:bg-[#8f4d1f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AlertTriangle size={17} aria-hidden="true" />
          {isSwitchPending ? "Switching" : "Sepolia"}
        </button>
      ) : null}

      {isConnected ? (
        <>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-white px-3 text-sm font-medium">
            {isSepolia ? (
              <CheckCircle2 size={17} aria-hidden="true" className="text-[#1d7b4f]" />
            ) : (
              <Wallet size={17} aria-hidden="true" />
            )}
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
  );
}
