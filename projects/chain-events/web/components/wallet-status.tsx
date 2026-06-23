"use client";

import { AlertTriangle, CheckCircle2, LogOut, PlugZap, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

function shortenAddress(address?: `0x${string}`) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    connectors,
    connect,
    error: connectError,
    isPending: isConnectPending,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const injectedConnector = connectors[0];
  const isSepolia = chainId === sepolia.id;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="ce-label inline-flex min-h-10 items-center gap-2 rounded-[var(--ce-radius-lg)] border border-[var(--ce-outline-variant)] bg-[var(--ce-surface-container-low)] px-4">
        {isConnected && !isSepolia ? (
          <AlertTriangle size={16} aria-hidden="true" className="text-[var(--ce-warning)]" />
        ) : (
          <CheckCircle2 size={16} aria-hidden="true" className="text-[var(--ce-success)]" />
        )}
        Sepolia
      </span>

      {isConnected && !isSepolia ? (
        <button
          type="button"
          disabled={isSwitchPending}
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="ce-label inline-flex min-h-10 items-center gap-2 rounded-[var(--ce-radius)] bg-[var(--ce-warning)] px-4 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AlertTriangle size={16} aria-hidden="true" />
          {isSwitchPending ? "Switching" : "Switch to Sepolia"}
        </button>
      ) : null}

      {isConnected ? (
        <>
          <span className="ce-label inline-flex min-h-10 items-center gap-2 rounded-[var(--ce-radius)] bg-[var(--ce-primary-container)] px-4 text-[var(--ce-inverse-on-surface)]">
            <Wallet size={16} aria-hidden="true" />
            {shortenAddress(address)}
          </span>
          <button
            type="button"
            onClick={() => disconnect()}
            className="ce-label inline-flex min-h-10 items-center gap-2 rounded-[var(--ce-radius)] border border-[var(--ce-outline-variant)] bg-white px-4 transition hover:border-[var(--ce-outline)]"
          >
            <LogOut size={16} aria-hidden="true" />
            Disconnect
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={!injectedConnector || isConnectPending}
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            className="ce-label inline-flex min-h-10 items-center gap-2 rounded-[var(--ce-radius)] bg-[var(--ce-secondary)] px-4 text-[var(--ce-on-secondary)] transition hover:bg-[var(--ce-on-secondary-container)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlugZap size={16} aria-hidden="true" />
            {isConnectPending ? "Connecting" : "Connect MetaMask"}
          </button>
          {connectError ? (
            <span className="ce-label max-w-72 rounded-[var(--ce-radius)] border border-[var(--ce-error)] bg-[var(--ce-error-container)] px-3 py-2 text-[var(--ce-error)]">
              {connectError.message}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}
