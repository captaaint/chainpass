# NFT-k a ChainInvite-ban

## Mi az NFT?
Az **NFT** = *Non-Fungible Token*, magyarul **nem helyettesíthető token**. Egy egyedi, blockchainen nyilvántartott "tulajdoni jegy", amiből minden darab megkülönböztethető a többitől.

- *Fungible (helyettesíthető):* 1 ETH = bármelyik másik 1 ETH, teljesen egyenértékűek. Ilyen a pénz.
- *Non-fungible (nem helyettesíthető):* minden darabnak saját **azonosítója (tokenId)** és saját adatai vannak – mint egy konkrét koncertjegynek a saját ülőhelyével és sorszámával. A #12-es jegy nem ugyanaz, mint a #13-as.

Technikailag az NFT egy szabványos smart contract. A legelterjedtebb szabvány az **ERC-721**: ez írja le, hogyan tárolja a contract, hogy melyik **tokenId** kié (`ownerOf`), és hogyan lehet átküldeni (`transferFrom`).

## Hogyan kapcsolódik a ChainInvite-hoz?
A jelenlegi (V1) modellben a meghívó csak egy `bool` egy `mapping`-ben: "ez a cím meg van hívva: igen/nem". Ez egyszerű és tökéletes a tanuláshoz.

Az **NFT-meghívó** ennek a "feljebb lépett" változata: a meghívó nem csak egy igaz/hamis érték, hanem egy **birtokolható token a vendég walletjében**. A vendég ténylegesen "kézben tartja" a belépőjét – látja a MetaMaskjában, megjelenik az OpenSea-szerű felületeken, és van saját kinézete/adata (kép, esemény neve, dátum).

> A megvalósítási terv ezt szándékosan **V2/V3 iránynak** jelölte: előbb a sima állapotkezelést tanuld meg (V1), és csak utána NFT-zz. Ez a fájl a "mi jön, ha készen állsz rá" magyarázó.

## Miért éri meg NFT-meghívó? (és miért nem mindig)
**Előnyök:**
- A vendég valóban **birtokolja** a belépőt, nem csak egy adatbázis-sor szól róla.
- **Látható és menő:** megjelenik a walletben, képpel, gyűjthető emlékként megmarad az esemény után is.
- **Portfólióban erős:** megmutatja, hogy érted az ERC-721 szabványt – ez keresett tudás.

**Hátrányok / megfontolások:**
- **Bonyolultabb:** több contract-kód, több teszt, NFT-metaadat kezelése.
- **Átruházhatóság:** egy sima ERC-721-et a vendég **továbbküldhet vagy eladhat** – ami egy személyes meghívónál nem feltétlenül jó. Erre a megoldás a *soulbound* (lásd lent).
- **Gas:** egy NFT kiadása (mint) drágább művelet, mint egy `bool` átállítása.

## Két NFT-irány a ChainInvite-hoz

### 1) Sima ERC-721 meghívó (V2)
A `inviteGuest` ahelyett, hogy csak `invited[eventId][guest] = true`-t állítana, **mintel egy NFT-t** a vendég címére. A check-in akkor érvényes, ha a vendég birtokolja az adott eseményhez tartozó tokent, és még nem használták fel.

### 2) Soulbound NFT meghívó (V3)
A **soulbound** ("lélekhez kötött") NFT egy olyan ERC-721, amit **nem lehet átruházni** – örökre ahhoz a wallethez tartozik, amelyikre kiadták. Technikailag úgy csinálod, hogy a `transfer` függvényeket letiltod (revert).

Ez **pont illik egy személyes meghívóhoz**: a belépőt nem lehet eladni vagy továbbadni, csak a meghívott használhatja. Megoldja a V1 "a QR lemásolható/továbbküldhető" gyengeségét is.

## Kulcsfogalmak (NFT-szótár)
- **ERC-721:** az NFT-k alap-szabványa Ethereumon.
- **tokenId:** egy konkrét NFT egyedi sorszáma (pl. minden meghívó kap egyet).
- **mint:** új NFT létrehozása és valakihez rendelése.
- **ownerOf(tokenId):** megmondja, melyik cím birtokolja az adott tokent.
- **tokenURI / metaadat:** link az NFT adataihoz (név, kép, esemény részletei) – jellemzően JSON.
- **soulbound:** nem átruházható NFT.
- **OpenZeppelin:** kész, auditált, biztonságos ERC-721 alap-implementáció – NFT-nél ezt használd, ne nulláról írj!

## Hogyan vezetnéd be? (magas szintű lépések)
1. Telepítsd az **OpenZeppelin** könyvtárat: `npm install @openzeppelin/contracts`.
2. A `ChainInvite.sol` (vagy egy új `ChainInviteNFT.sol`) örököljön az OpenZeppelin `ERC721`-ből.
3. Az `inviteGuest`-ben hívj `_mint`-et / `_safeMint`-et a vendég címére, és tárold, melyik tokenId melyik eseményhez tartozik.
4. A `checkIn` ellenőrizze, hogy a vendég birtokolja-e a tokent (`ownerOf`) + még nincs felhasználva.
5. Soulbound változathoz: tiltsd le az átruházást (az OpenZeppelin `_update`/transfer hook felülírásával revertelj).
6. Bővítsd a teszteket: mintelés, tulajdonjog, (soulboundnál) az átküldés tiltásának ellenőrzése.

⚠️ **Kezdő-buktató:** NFT-contractot **soha** ne írj nulláról – mindig OpenZeppelinből indulj ki. A biztonság itt kritikus, és az auditált alap ingyen megspórol egy csomó hibát.

## Kapcsolódás
Az NFT egy [Solidity](solidity.md) contract (ERC-721 szabvány szerint), amit ugyanúgy [Hardhat](hardhat.md)-tal fordítasz/tesztelsz/deployolsz [Sepolia](ethereum-sepolia.md)-ra, és [wagmi](wagmi.md)/[viem](viem.md)-mel hívsz a frontendről. A [MetaMask](metamask-wallet.md) az NFT-t a wallet "Collectibles/NFT" fülén is megjeleníti.

## Hivatalos dokumentáció
- ERC-721 szabvány: https://eips.ethereum.org/EIPS/eip-721
- OpenZeppelin ERC-721: https://docs.openzeppelin.com/contracts/erc721
- NFT-bevezető (ethereum.org): https://ethereum.org/en/nft/
