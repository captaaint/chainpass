# wagmi

## Mi ez?
A **wagmi** egy React-könyvtár (hook-gyűjtemény), amely a wallet- és contract-kezelést teszi egyszerűvé a frontenden. A bonyolult blockchain-műveleteket kényelmes React **hookokká** csomagolja, mint `useAccount`, `useConnect`, `useReadContract`, `useWriteContract`. A háttérben a [viem](viem.md)-et használja.

## Miért ezt használjuk?
- **Sok beépített logika ingyen:** wallet csatlakozás, hálózatváltás, betöltési/hibaállapotok, automatikus újrakérés – ezeket nem neked kell megírni.
- **React-barát:** a hookok illeszkednek a Next.js komponens-világba; az adatok automatikusan frissülnek.
- **viemmel egy csapat:** ugyanattól a csapattól, tökéletes összhang és típusosság.

## Mi a funkciója a ChainInvite-ban?
- **Wallet connect:** a "Connect Wallet" gomb és a csatlakozott cím kezelése (`useAccount`, `useConnect`).
- **Hálózat-ellenőrzés:** jelzés, ha a felhasználó nem [Sepolia](ethereum-sepolia.md)-n van + "switch network".
- **Olvasás:** `useReadContract` az `eventCounter`, `isValidInvite`, `getEvent` megjelenítéséhez.
- **Írás:** `useWriteContract` a `createEvent`, `inviteGuest`, `setScanner`, `checkIn` tranzakciókhoz, beépített pending/success/error állapotokkal.

## Kulcsfogalmak
- **Hook:** React-függvény (`use...`), ami adatot/állapotot ad egy komponensnek.
- **WagmiProvider + QueryClient:** a layoutban beágyazott "keret", amitől a hookok működnek.
- **Connector:** a wallet-kapcsolat módja (pl. [MetaMask](metamask-wallet.md) / injected).

## Kapcsolódás
A wagmi a [Next.js](nextjs.md) komponenseiben él, belül a [viem](viem.md)-et hajtja, a [MetaMask](metamask-wallet.md)-kel írat alá, és a [Sepolia](ethereum-sepolia.md)-n lévő contractot hívja.

## Hivatalos dokumentáció
- https://wagmi.sh/
