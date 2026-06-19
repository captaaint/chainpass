# ChainInvite – Technológiai magyarázók

Ez a mappa minden használt technológiához tartalmaz egy külön, kezdőbarát magyarázót:
**mi ez, miért használjuk pont ezt, és mi a funkciója a ChainInvite projektben.**

## Hogyan illeszkedik össze az egész (1 perces áttekintő)

```
        ┌─────────────────────────────────────────────┐
        │  FELHASZNÁLÓ böngészője                       │
        │                                               │
        │  Next.js + TypeScript  ── UI (oldalak)        │
        │      │                                        │
        │  Tailwind   ── kinézet                        │
        │      │                                        │
        │  wagmi      ── React-kapocs a wallethez       │
        │      │                                        │
        │  viem       ── alacsony szintű blockchain hív.│
        │      │                                        │
        │  MetaMask   ── aláírás + tranzakció jóváhagyás│
        └──────┼────────────────────────────────────────┘
               │ RPC (Alchemy/Infura)
               ▼
        ┌─────────────────────────────────────────────┐
        │  SEPOLIA testnet (Ethereum-másolat)           │
        │     ChainInvite.sol (Solidity smart contract) │
        └─────────────────────────────────────────────┘
               ▲
               │ fordítás / teszt / deploy
        ┌─────────────────────────────────────────────┐
        │  Hardhat (fejlesztői környezet, gépeden fut)  │
        └─────────────────────────────────────────────┘

   QR-kód:  qrcode (generálás, vendégoldal)  +  html5-qrcode (olvasás, scanner)
```

## Fájlok

| Réteg | Technológia | Fájl |
|---|---|---|
| Smart contract nyelv | Solidity | [solidity.md](solidity.md) |
| Fejlesztői környezet | Hardhat | [hardhat.md](hardhat.md) |
| Blockchain / teszthálózat | Ethereum + Sepolia + RPC | [ethereum-sepolia.md](ethereum-sepolia.md) |
| Wallet | MetaMask | [metamask-wallet.md](metamask-wallet.md) |
| Frontend keretrendszer | Next.js | [nextjs.md](nextjs.md) |
| Nyelv (frontend) | TypeScript | [typescript.md](typescript.md) |
| Wallet/contract React-réteg | wagmi | [wagmi.md](wagmi.md) |
| Blockchain-kliens könyvtár | viem | [viem.md](viem.md) |
| Stílus | Tailwind CSS | [tailwind.md](tailwind.md) |
| QR generálás + olvasás | qrcode / html5-qrcode | [qr-codes.md](qr-codes.md) |

> Ajánlott olvasási sorrend kezdőként: Ethereum/Sepolia → Solidity → Hardhat → Next.js → TypeScript → viem → wagmi → MetaMask → QR → Tailwind.
