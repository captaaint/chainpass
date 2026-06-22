# ChainInvite Technology Notes

This folder explains the main technologies used by ChainInvite and how they fit together.

## Overview

```text
User browser
  Next.js + TypeScript  -> pages and UI
  Tailwind CSS          -> styling
  wagmi                 -> React wallet and contract hooks
  viem                  -> Ethereum RPC client
  MetaMask              -> signing and transaction approval
        |
        v
Sepolia testnet
  ChainInvite contracts

Hardhat
  compile, test, and deploy contracts
```

QR codes are generated with `qrcode` and scanned with `html5-qrcode`.

## Files

| Layer | Technology | File |
|---|---|---|
| Smart contract language | Solidity | [solidity.md](solidity.md) |
| Development environment | Hardhat | [hardhat.md](hardhat.md) |
| Chain and RPC | Ethereum + Sepolia | [ethereum-sepolia.md](ethereum-sepolia.md) |
| Wallet | MetaMask | [metamask-wallet.md](metamask-wallet.md) |
| Frontend framework | Next.js | [nextjs.md](nextjs.md) |
| Frontend language | TypeScript | [typescript.md](typescript.md) |
| React wallet layer | wagmi | [wagmi.md](wagmi.md) |
| RPC client | viem | [viem.md](viem.md) |
| Styling | Tailwind CSS | [tailwind.md](tailwind.md) |
| QR codes | qrcode / html5-qrcode | [qr-codes.md](qr-codes.md) |
| NFT invite direction | ERC-721 / soulbound | [nft.md](nft.md) |
