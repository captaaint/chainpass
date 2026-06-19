# MetaMask (wallet)

## Mi ez?
A **MetaMask** egy böngésző-bővítményként futó **kripto-wallet**. Két fő dolgot csinál: (1) tárolja a kulcsaidat és a hozzájuk tartozó **címet** (`0x...`), (2) **aláírja** a tranzakciókat – vagyis amikor egy weboldal blockchain-műveletet akar a nevedben, a MetaMask kér tőled jóváhagyást.

A **cím** a blockchain-beli "azonosítód". A **privát kulcs / seed phrase** ennek a jelszava – akinél ez van, az hozzáfér a pénzhez. Ezért szent.

## Miért ezt használjuk?
- **A legelterjedtebb wallet:** szinte minden dApp és tutorial ezzel számol.
- **Egyszerű integráció:** a [wagmi](wagmi.md) készen támogatja ("injected"/MetaMask connector).
- **Hálózatváltás és teszt-ETH kezelése** kényelmesen megoldható benne.

## Mi a funkciója a ChainInvite-ban?
- **Azonosítás:** a csatlakozott cím dönti el, ki vagy – szervező, vendég vagy scanner. A contract `msg.sender`-je ez a cím lesz.
- **Aláírás/jóváhagyás:** minden írási művelet (`createEvent`, `inviteGuest`, `checkIn`) a MetaMask jóváhagyó ablakán megy át.
- **Hálózat:** a MetaMaskban [Sepolia](ethereum-sepolia.md) van kiválasztva, benne a faucetből szerzett teszt-ETH.

## ⚠️ Biztonság (kezdőként a legfontosabb)
- Hozz létre **külön, csak tesztre szánt** walletet.
- **Soha** ne tegyél bele valódi pénzt ehhez a projekthez.
- A **seed phrase / privát kulcs** soha ne kerüljön kódba, screenshotba, gitbe. A `.env`-ben tárolt kulcs is csak a tesztwalleté lehet, és a `.env` legyen a `.gitignore`-ban.

## Kulcsfogalmak
- **Cím (`0x...`):** publikus azonosító, nyugodtan megosztható.
- **Privát kulcs / seed phrase:** titkos "jelszó", soha ne oszd meg.
- **Aláírás:** kriptográfiai bizonyíték, hogy a művelet tényleg tőled származik.

## Kapcsolódás
A MetaMaskot a [wagmi](wagmi.md) köti be, a [viem](viem.md) wallet client küldi rajta a tranzakciókat a [Sepolia](ethereum-sepolia.md) felé.

## Hivatalos dokumentáció
- https://docs.metamask.io/
