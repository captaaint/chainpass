# viem

## Mi ez?
A **viem** egy modern, TypeScript-alapú könyvtár, amellyel a kódod beszél az Ethereummal (és más EVM-láncokkal). Ez az **alacsony szintű "motor"**: ő intézi a tényleges blockchain-hívásokat – adatok lekérdezését, tranzakciók összerakását és elküldését, az ABI alapján a függvények kódolását/dekódolását.

## Miért ezt használjuk?
- **Modern és gyors:** a régebbi ethers.js/web3.js helyett ma a viem a leggyakoribb választás.
- **Kiváló TypeScript-támogatás:** a contract függvényeinek típusai automatikusan jönnek – nehezebb hibázni.
- **A wagmi alapja:** a [wagmi](wagmi.md) belül viemet használ, így a kettő tökéletesen összeillik.

## Mi a funkciója a ChainInvite-ban?
- **Olvasás:** pl. `isValidInvite(eventId, guest)` vagy `getEvent(eventId)` lekérdezése a contractról.
- **Tranzakció:** a `checkIn`, `createEvent`, `inviteGuest` hívások összeállítása és elküldése.
- **Segédfüggvények:** pl. `isAddress` a beírt wallet címek validálására, egységek/formátumok konvertálása.
- **Kliens-konfiguráció:** a [Sepolia](ethereum-sepolia.md) hálózat és az [RPC](ethereum-sepolia.md) beállítása.

## Hol látod a kódban?
A `web/lib/contract.ts`-ben általában a contract címe + ABI + a chain-konfiguráció. A legtöbb React-komponensben viszont nem közvetlenül a viemet hívod, hanem a kényelmesebb [wagmi](wagmi.md) hookokat – amik a háttérben viemet használnak.

## Kulcsfogalmak
- **Public client:** olvasásra (ingyenes lekérdezések).
- **Wallet client:** írásra (tranzakció aláírása a [MetaMask](metamask-wallet.md)-kel).
- **ABI:** a contract függvény-leírása, amit a viem a hívások kódolásához használ.

## Kapcsolódás
A viem a [wagmi](wagmi.md) alatt dolgozik, a [Hardhat](hardhat.md) által generált ABI-t használja, és a [Sepolia](ethereum-sepolia.md)-val kommunikál RPC-n.

## Hivatalos dokumentáció
- https://viem.sh/docs/getting-started
