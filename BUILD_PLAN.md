# ChainInvite – Megvalósítási terv (task-bontás)

> Blockchain-alapú eseménymeghívó + QR check-in dApp.
> Ez a fájl a [megvalósítási terv PDF](../chaininvite/chaininvite_megvalositasi_terv.pdf) gyakorlati, kipipálható lebontása.
> Kezdő blockchain-fejlesztőnek. Minden taskhoz tartozik: **mit csinálsz**, **konkrét parancs/kód**, és **kész, ha…** kritérium.

**Stack:** Solidity 0.8.x · Hardhat 3 · Next.js + TypeScript · wagmi + viem · Sepolia testnet
**Munkamenet javaslat:** felülről lefelé haladj, ne ugorj. Minden szakasz végén commitolj.

---

## Hogyan használd ezt a fájlt

- A `[ ]` jelölést írd át `[x]`-re, ha kész egy task.
- A 🧠 ikonnál van **fogalom-magyarázat** – ha még új a téma, ezt olvasd el először.
- A ⚠️ ikon **kezdő-buktatókat** jelöl.
- Egy szakasz akkor "kész", ha a végén lévő **Szakasz-DoD** (Definition of Done) minden pontja teljesül.

---

## 0. szakasz – Előkészítés és eszközök (≈ 0,5 nap)

**Cél:** működő, üres projektváz; minden eszköz telepítve.

- [x] **0.1 – Node.js (LTS) telepítése.** Ellenőrzés: `node -v` (≥ 20) és `npm -v` fusson le.
- [x] **0.2 – Kódszerkesztő + bővítmények.** VS Code + a "Solidity" (Nomic Foundation) és "Prettier" bővítmények.
- [x] **0.3 – MetaMask wallet telepítése** (böngésző-bővítmény). Hozz létre egy **külön, csak tesztre szánt** walletet.
  - ⚠️ Soha ne tedd ebbe valódi pénzt, és a *seed phrase*-t soha ne másold be kódba/fájlba.
- [x] **0.4 – Sepolia teszt-ETH szerzése** egy faucet-ről (pl. a wallet hálózatát Sepolia-ra állítva). Erre a deployhoz lesz szükség.
- [x] **0.5 – Ingyenes RPC-kulcs** beszerzése (Alchemy vagy Infura), Sepolia hálózathoz. Mentsd el az RPC URL-t.
- [ ] **0.6 – Git repo rendberakása.** Ez a mappa már git repo. Hozz létre egy `.gitignore`-t (lásd lent) és csinálj első commitot. *(Részben kész: `.gitignore` létrehozva; első commit még nincs.)*

🧠 **Fogalmak:**
- *Testnet (Sepolia):* "éles" Ethereum-másolat, de a rajta lévő ETH értéktelen → ingyen kísérletezhetsz.
- *RPC URL:* az a végpont, amin keresztül a kódod beszél a blockchainnel.
- *Faucet:* ingyenes teszt-ETH osztó oldal.

**`.gitignore` (másold be):**
```
node_modules
.env
.env.local
artifacts
cache
typechain-types
web/.next
web/node_modules
```

**Szakasz-DoD:** `node -v` működik · van tesztwallet Sepolia ETH-vel · van RPC URL · van `.gitignore` + első commit.

---

## 1. szakasz – Hardhat projekt + üres contract (≈ 0,5 nap)

**Cél:** lefordul egy üres Solidity szerződés, fut a lokális teszt.

- [x] **1.1 – Hardhat init a repo gyökerében.**
  ```bash
  npm init -y
  npm install --save-dev hardhat
  npx hardhat init   # válaszd a TypeScript projektet
  ```
- [x] **1.2 – Mappaszerkezet ellenőrzése:** legyen `contracts/`, `test/`, `scripts/`.
- [x] **1.3 – Próba-fordítás.** `npx hardhat compile` hibamentesen fusson.
- [x] **1.4 – Üres `contracts/ChainInvite.sol` létrehozása** SPDX licenc + pragma sorral:
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.24;

  contract ChainInvite {
      // ide jön a logika a 2. szakaszban
  }
  ```
- [ ] **1.5 – Commit:** `chore: hardhat scaffold`.

🧠 **Fogalmak:** *Hardhat* = a Solidity "fejlesztői svájcibicska" (fordítás, teszt, lokális blockchain, deploy egy helyen).

**Szakasz-DoD:** `npx hardhat compile` zöld · van `ChainInvite.sol` · commit kész.

---

## 2. szakasz – Smart contract logika (≈ 2–3 nap)

**Cél:** a teljes MVP-contract megírva, fordul.
Itt tanulod meg a blockchain lényegét: állapot (storage), `mapping`, `event`, jogosultság (`require`).

🧠 **Tanulási mini-sorrend (mielőtt kódolsz):** struct → mapping → modifier → event → require → visibility (public/external/view). A Solidity dokumentáció "Structure of a Contract" fejezete elég.

### 2.1 Adatmodell
- [x] **2.1.1 –** `Event` struct: `name`, `description`, `startTime`, `organizer`, `active`.
- [x] **2.1.2 –** `uint256 public eventCounter;` (auto eventId).
- [x] **2.1.3 –** `mapping(uint256 => Event) public events;`
- [x] **2.1.4 –** `mapping(uint256 => mapping(address => bool)) public invited;`
- [x] **2.1.5 –** `mapping(uint256 => mapping(address => bool)) public checkedIn;`
- [x] **2.1.6 –** `mapping(uint256 => mapping(address => bool)) public scannerAllowed;`

### 2.2 Eventek (logok)
- [x] **2.2.1 –** `EventCreated(uint256 eventId, address organizer, string name, uint256 startTime)`
- [x] **2.2.2 –** `GuestInvited(uint256 eventId, address guest)`
- [x] **2.2.3 –** `ScannerUpdated(uint256 eventId, address scanner, bool allowed)`
- [x] **2.2.4 –** `GuestCheckedIn(uint256 eventId, address guest, address scanner, uint256 timestamp)`

🧠 *Event/log:* a szerződés "üzenőfala". Olcsó, és a frontend ebből tudja gyorsan kilistázni, mi történt.

### 2.3 Függvények
- [x] **2.3.1 – `createEvent(name, description, startTime)`** → új esemény, `eventCounter++`, `EventCreated` emit. Bárki hívhatja (ő lesz az organizer = `msg.sender`).
- [x] **2.3.2 – `inviteGuest(eventId, guest)`** → csak az esemény organizere. `invited[eventId][guest] = true`, `GuestInvited` emit.
- [x] **2.3.3 – `inviteMany(eventId, guests[])`** → ciklus az `inviteGuest` logikán. ⚠️ csak kis listára (gas!).
- [x] **2.3.4 – `setScanner(eventId, scanner, allowed)`** → csak organizer. `ScannerUpdated` emit.
- [x] **2.3.5 – `checkIn(eventId, guest)`** → organizer **vagy** engedélyezett scanner hívhatja. Feltételek: meghívott ✔ + még nincs `checkedIn` ✔. Sikerkor `checkedIn=true`, `GuestCheckedIn` emit.
- [x] **2.3.6 – `isValidInvite(eventId, guest)` `view`** → `invited && !checkedIn`. Publikus, ingyenes olvasás.
- [x] **2.3.7 – `getEvent(eventId)` `view`** → esemény adatok.

### 2.4 Jogosultság-őrök
- [x] **2.4.1 –** `onlyOrganizer(eventId)` modifier vagy `require(msg.sender == events[eventId].organizer, "not organizer")`.
- [x] **2.4.2 –** check-in jogosultság: `require(msg.sender == organizer || scannerAllowed[eventId][msg.sender], "not allowed")`.
- [x] **2.4.3 –** beszédes `require` hibaüzenetek mindenhol.

- [ ] **2.5 – `npx hardhat compile` zöld · commit:** `feat: ChainInvite contract MVP`. *(Részben kész: compile zöld; commit még nincs.)*

⚠️ **Kezdő-buktatók:** `msg.sender` mindig a hívó címe – ezzel csinálod a jogosultságot. · A `mapping`-et nem lehet végigiterálni → listázáshoz az eventeket/logokat használd. · A `startTime`-ot UNIX timestampként (másodperc) tárold.

**Szakasz-DoD:** minden függvény + event + jogosultság megírva · fordul · commit kész.

---

## 3. szakasz – Unit tesztek (≈ 1–2 nap)

**Cél:** legalább 10 teszt, a happy path ÉS a hibás esetek lefedve. Itt jössz rá, tényleg jól véded-e a logikát.

- [x] **3.1 –** Teszt-keret a `test/ChainInvite.test.ts`-ben (Hardhat alapból ad mintát).
- [x] **3.2 –** ✅ Esemény létrehozása működik, `eventCounter` nő, `EventCreated` emittál.
- [x] **3.3 –** ✅ Organizer meg tud hívni vendéget.
- [x] **3.4 –** ❌ NEM-organizer **nem** hívhat meg (revert).
- [x] **3.5 –** ❌ Nem meghívott wallet **nem** check-inelhető (revert).
- [x] **3.6 –** ✅ Meghívott vendég check-inelhető, `GuestCheckedIn` emittál.
- [x] **3.7 –** ❌ Ugyanaz a vendég **másodszor** nem check-inelhető (revert) – ez az "egyszer használatos" lényege.
- [x] **3.8 –** ✅ Engedélyezett scanner tud check-int indítani.
- [x] **3.9 –** ❌ Tiltott/idegen cím **nem** tud check-int indítani (revert).
- [x] **3.10 –** ✅ `isValidInvite` helyes értéket ad check-in előtt/után.
- [x] **3.11 – Futtatás:** `npx hardhat test` – minden zöld.
- [x] **3.12 – Commit:** `test: contract unit tests`.

🧠 *Unit teszt:* kis automata próba, ami egy-egy szabályt ellenőriz. A "revert" = a szerződés szándékosan elutasít egy tiltott műveletet – ezt teszteled.

**Szakasz-DoD:** ≥ 10 teszt, mind zöld · commit kész.

---

## 4. szakasz – Deploy Sepolia testnetre (≈ 0,5–1 nap)

**Cél:** a contract publikusan él egy valódi teszthálózaton, megvan a címe.

- [x] **4.1 – `.env` létrehozása** (NEM kerül gitbe!): `SEPOLIA_RPC_URL=...` és `PRIVATE_KEY=...` (a tesztwallet privát kulcsa).
  - ⚠️ Csak a **tesztwallet** kulcsát! Ellenőrizd, hogy a `.env` benne van a `.gitignore`-ban.
- [x] **4.2 – Hardhat config** kiegészítése a Sepolia hálózattal (RPC URL + account a `.env`-ből).
- [x] **4.3 – `scripts/deploy.ts`** megírása (contract deploy + a cím kiírása konzolra).
- [x] **4.4 – Deploy futtatása** Sepolia-ra. Másold ki a kapott **contract address**-t.
- [x] **4.5 – Ellenőrzés** a [sepolia.etherscan.io](https://sepolia.etherscan.io) oldalon: keresd rá a címre, lásd a deploy tranzakciót.
- [x] **4.6 –** Mentsd a contract címet egy `web/.env.local`-ba (frontendhez) és a README-be.
- [x] **4.7 – Commit:** `chore: deploy script + sepolia config`.

🧠 *Deploy:* a lefordított contractot feltöltöd a hálózatra; onnantól egy **címen** él, és bárki hívhatja.

**Szakasz-DoD:** contract él Sepolián · van címe · látszik Etherscanon · cím elmentve.

---

## 5. szakasz – Frontend váz + wallet connect (≈ 1 nap)

**Cél:** fut a Next.js app, csatlakozik a wallet, olvas a contractról.

- [x] **5.1 – Next.js app** a `web/` mappában: `npx create-next-app@latest web` (TypeScript + App Router + Tailwind igen).
- [x] **5.2 – Függőségek:** `npm install wagmi viem @tanstack/react-query`.
- [x] **5.3 – wagmi konfiguráció** Sepolia chainnel + provider beágyazása a layoutba.
- [x] **5.4 – "Connect Wallet" gomb** – csatlakozás MetaMaskkal, csatlakozott cím kijelzése.
- [x] **5.5 – Hálózat-ellenőrzés:** ha nem Sepolián van a user, jelezzen a UI + "switch network" gomb.
- [x] **5.6 – Contract ABI + cím** bekötése (`web/lib/contract.ts`). Az ABI-t a Hardhat `artifacts/`-ból másold.
- [x] **5.7 – Olvasás teszt:** jelenítsd meg az `eventCounter`-t a főoldalon (read-only hívás).
- [ ] **5.8 – Commit:** `feat: web scaffold + wallet connect`.

🧠 *ABI:* a contract "használati utasítása" JSON-ban – ebből tudja a frontend, milyen függvényeket hívhat. · *wagmi/viem:* TS könyvtárak, amik elintézik a wallet- és contract-kommunikációt.

⚠️ *Read vs. Write:* az olvasás (`view`) ingyenes és azonnali; az írás (state-változás) tranzakció → gas + várakozás + MetaMask-jóváhagyás.

**Szakasz-DoD:** app fut · wallet csatlakozik · rossz hálózatot jelez · `eventCounter` látszik.

---

## 6. szakasz – Admin (szervezői) felület (≈ 2 nap)

**Cél:** a szervező eseményt hoz létre és meghív vendégeket – böngészőből.

- [x] **6.1 – `/admin`** oldal: a csatlakozott wallethez tartozó események listája (a `EventCreated` logokból szűrve organizerre).
- [x] **6.2 – `/admin/events/new`** űrlap: név, leírás, kezdési idő → `createEvent` tranzakció.
- [x] **6.3 – Tranzakció-állapotok kezelése:** pending / success / error visszajelzés a UI-n (ne fagyjon meg a gomb).
- [x] **6.4 – `/admin/events/[id]`** esemény-részletek: adatok + meghívottak listája.
- [x] **6.5 – Invite form** ezen az oldalon: wallet cím → `inviteGuest`. (Opcionális: több cím → `inviteMany`.)
- [x] **6.6 – Scanner-kezelés:** scanner cím hozzáadása/tiltása → `setScanner`.
- [x] **6.7 – Check-in státusz** oszlop a meghívottaknál (a `checkedIn` mappingből / `GuestCheckedIn` logokból).
- [ ] **6.8 – Commit:** `feat: admin dashboard`.

⚠️ Cím-validáció: ellenőrizd, hogy a beírt vendégcím valódi formátumú (viem `isAddress`), különben a tranzakció elszáll.

**Szakasz-DoD:** új esemény létrehozható UI-ból · vendég meghívható · check-in státusz látszik · tranzakció-állapotok visszajeleznek.

---

## 7. szakasz – Vendég meghívó oldal + QR generálás (≈ 1–2 nap)

**Cél:** a vendég megnyitja a saját meghívóját és kap egy QR-kódot.

- [x] **7.1 – QR könyvtár:** `npm install qrcode` (+ típusok).
- [x] **7.2 – `/invite/[eventId]`** oldal: wallet connect + esemény-alapadatok kijelzése.
- [x] **7.3 – Meghívó-ellenőrzés:** `isValidInvite(eventId, csatlakozott_cím)` hívása; ha érvényes, mutasd a QR-t, ha nem, magyarázó üzenet.
- [x] **7.4 – QR-kód generálás** a payloadból: `{ "eventId": <id>, "guest": "0x..." }`.
- [x] **7.5 – Állapot-jelzés:** "Érvényes meghívó" / "Már felhasznált" / "Nincs meghívód".
- [ ] **7.6 – Commit:** `feat: guest invite page + QR`.

🧠 *Miért JSON a QR-ben?* A scanner ezt olvassa be, és ebből tudja, melyik eseményre + melyik címre kell a check-int indítani.

**Szakasz-DoD:** vendég látja a meghívóját · érvényes meghívónál QR jelenik meg · állapotok helyesek.

---

## 8. szakasz – Scanner (beléptető) oldal (≈ 2–3 nap)

**Cél:** a helyszíni eszköz beolvassa a QR-t és on-chain check-ineli a vendéget. Ez a projekt látványos csúcspontja.

- [x] **8.1 – QR-olvasó könyvtár:** `npm install html5-qrcode` (vagy `@zxing/browser`).
- [x] **8.2 – `/scanner/[eventId]`** oldal: wallet connect (a scanner saját engedélyezett címével) + kamera-előnézet.
- [x] **8.3 – QR dekódolás:** beolvasott szöveg → JSON parse → `eventId` + `guest` kinyerése. ⚠️ try/catch hibás QR-re.
- [x] **8.4 – Validáció check-in előtt:** `isValidInvite` hívás; ha érvénytelen, **ne** indíts tranzakciót, mutass hibát.
- [x] **8.5 – Check-in tranzakció:** `checkIn(eventId, guest)` küldése; pending/success/error állapot kijelzése nagyban, jól láthatóan.
- [ ] **8.6 – Egyszer-használatosság a gyakorlatban:** ugyanazt a QR-t másodszor beolvasva piros "Már felhasznált" üzenet jöjjön (a contract revertel, a UI ezt szépen kezeli). *(UI kezeli az érvénytelen/felhasznált állapotot; valós QR + MetaMask check-in után ellenőrizendő.)*
- [ ] **8.7 – Commit:** `feat: scanner page + check-in flow`.

⚠️ A kamera **HTTPS-t (vagy localhostot)** igényel a böngészőben. Telefonos teszthez vagy deployolt HTTPS-oldal, vagy localhost kell.

**Szakasz-DoD:** kamera olvas · hibás QR nem indít tranzakciót · érvényes QR sikeres check-int csinál · második olvasás "felhasznált"-at jelez.

---

## 9. szakasz – Polish, README, demó (≈ 1–2 nap)

**Cél:** portfólióképes, bemutatható verzió.

- [x] **9.1 – Loading- és üres állapotok:** spinner tranzakció közben, értelmes üzenet üres eseménylistára.
- [x] **9.2 – Hibakezelés:** elutasított tranzakció, rossz hálózat, nem csatlakozott wallet – mind barátságos üzenet.
- [x] **9.3 – Demó-adatok:** hozz létre 1–2 mintaeseményt + pár meghívót a bemutatóhoz.
- [x] **9.4 – README.md megírása:** projekt célja · stack · telepítés lépésről lépésre · `.env` változók · deployolt contract cím · demó-lépések (organizer → invite → guest QR → scanner check-in).
- [x] **9.5 – Képernyőképek vagy rövid demó-videó** a README-be / portfólióba.
- [ ] **9.6 – Frontend deploy** (pl. Vercel) – hogy a kamerás scanner HTTPS-en menjen és linkelhető legyen. *(Előkészítve: Vercel CLI login szükséges; deploy instrukciók a README-ben.)*
- [ ] **9.7 – Végső commit + tag:** `release: ChainInvite v1`.

**Szakasz-DoD = Projekt Definition of Done:**
- [x] Contract lokálisan tesztelve (happy path + hibás esetek).
- [x] Contract Sepolián deployolva.
- [x] Admin tud eseményt létrehozni és vendéget meghívni.
- [x] Vendég látja a meghívót és QR-t kap.
- [ ] Scanner beolvas és sikeresen check-inel.
- [ ] Második beolvasás "felhasznált"-at jelez.
- [x] README teljes (cél, telepítés, env, deploy cím, demó-lépések).

---

## 10. szakasz – ERC-721 NFT-meghívó (V2) (≈ 2–3 nap)

**Cél:** a meghívó ne csak egy `bool` legyen a `mapping`-ben, hanem egy **birtokolható NFT** a vendég walletjében (ERC-721 szabvány). A vendég látja a belépőjét MetaMaskban, a check-in pedig a token tulajdonjogán alapul.
**Előfeltétel:** a V1 (0–9. szakasz) kész és deployolva. Háttér: lásd [docs/nft.md](docs/nft.md).

🧠 **Tanulási mini-sorrend (mielőtt kódolsz):** mi az ERC-721 → `ownerOf` / `_safeMint` → öröklődés Solidityben (`is ERC721`) → `tokenId` kiosztás → `tokenURI`/metaadat. Az [OpenZeppelin ERC-721 doksi](https://docs.openzeppelin.com/contracts/erc721) bevezetője elég.

⚠️ **Alapelv:** NFT-contractot **soha ne írj nulláról** – mindig az auditált OpenZeppelin alapból indulj ki.

### 10.1 Előkészítés
- [x] **10.1.1 – OpenZeppelin telepítése:** `npm install @openzeppelin/contracts`.
- [x] **10.1.2 – Új contract másolatból:** `contracts/ChainInviteNFT.sol` (a V1-et ne bántsd, hogy maradjon összehasonlítási alap).
- [x] **10.1.3 – Öröklődés beállítása:**
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.24;

  import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

  contract ChainInviteNFT is ERC721 {
      constructor() ERC721("ChainInvite Ticket", "CINV") {}
      // ... a V1 esemény-logika ide is jön
  }
  ```

### 10.2 Adatmodell-kiegészítés
- [x] **10.2.1 –** `uint256 public nextTokenId;` (auto tokenId kiosztáshoz).
- [x] **10.2.2 –** `mapping(uint256 => uint256) public tokenEvent;` – melyik tokenId melyik eseményhez tartozik.
- [x] **10.2.3 –** `mapping(uint256 => bool) public tokenUsed;` – a check-in már felhasználta-e ezt a tokent (egyszer-használatosság).
- [x] **10.2.4 –** (Opcionális) `mapping(uint256 => mapping(address => uint256)) public guestToken;` – gyors visszakereséshez, hogy egy vendégnek melyik tokenje van egy eseményre.

### 10.3 Mint a meghíváskor
- [x] **10.3.1 – `inviteGuest` átírása:** a `bool` állítás helyett (vagy mellett) `_safeMint(guest, tokenId)`-t hív, beállítja a `tokenEvent[tokenId] = eventId`-t, növeli a `nextTokenId`-t.
- [x] **10.3.2 – Új event:** `InviteMinted(uint256 eventId, address guest, uint256 tokenId)` – a frontend ebből listáz.
- [x] **10.3.3 – Dupla-mint védelem:** ugyanarra az esemény+vendég párra ne lehessen kétszer mintelni (`require`).

### 10.4 Check-in a token tulajdonjoga alapján
- [x] **10.4.1 – `checkIn` átírása:** a vendég `guest` címe **birtokolja-e** az adott `tokenId`-t (`ownerOf(tokenId) == guest`), és az adott eseményhez tartozik-e (`tokenEvent[tokenId] == eventId`).
- [x] **10.4.2 –** Feltétel: `tokenUsed[tokenId] == false`. Sikerkor `tokenUsed[tokenId] = true`, `GuestCheckedIn` emit.
- [x] **10.4.3 –** Jogosultság marad: organizer **vagy** engedélyezett scanner hívhatja.
- [x] **10.4.4 – `isValidInvite` frissítése:** tulajdonjog + nem használt token alapján adjon `bool`-t.

### 10.5 (Opcionális) Metaadat – hogy szép legyen MetaMaskban
- [x] **10.5.1 – `tokenURI(tokenId)` override:** adjon vissza egy JSON-metaadatot (név, leírás, kép, esemény dátuma).
- [ ] **10.5.2 –** Kezdéshez elég egy statikus kép-URL; később IPFS. ⚠️ személyes adatot ne tegyél a metaadatba (publikus!). *(A JSON data URI elkészült; külön kép-URL/IPFS még nincs.)*

### 10.6 Tesztek (bővítsd a tesztfájlt)
- [x] **10.6.1 –** ✅ Meghíváskor tényleg mintelődik NFT, és a vendég lesz a `ownerOf`.
- [x] **10.6.2 –** ✅ A `tokenEvent` a helyes eseményre mutat.
- [x] **10.6.3 –** ❌ Ugyanarra az esemény+vendég párra nem lehet kétszer mintelni (revert).
- [x] **10.6.4 –** ✅ A token tulajdonosa check-inelhető, és utána `tokenUsed = true`.
- [x] **10.6.5 –** ❌ Olyan cím, aki nem birtokolja a tokent, nem check-inelhető (revert).
- [x] **10.6.6 –** ❌ Már felhasznált token másodszor nem check-inelhető (revert).
- [x] **10.6.7 – Futtatás:** `npx hardhat test` – minden zöld.

### 10.7 Deploy + frontend bekötés
- [ ] **10.7.1 – Deploy** a `ChainInviteNFT`-re Sepoliára (új `scripts/deploy-nft.ts` vagy a meglévő bővítése), cím elmentése. *(Deploy script elkészült; Sepolia deploy még nincs futtatva.)*
- [ ] **10.7.2 – ABI + cím frissítése** a frontenden (`web/lib/contract.ts`). ⚠️ contract-változás után mindig új ABI!
- [ ] **10.7.3 – Vendégoldal:** mutassa, hogy a meghívó már egy birtokolt NFT (tokenId), a QR payload kapjon `tokenId`-t is.
- [ ] **10.7.4 – Scanner:** a `checkIn` a `tokenId` alapján menjen.
- [ ] **10.7.5 – (Bónusz)** "Nézd meg a walletedben / OpenSea testneten" link a vendégoldalon.

- [ ] **10.8 – Commit:** `feat: ERC-721 NFT invites (V2)`.

🧠 *Mit tanulsz itt?* Szabvány-öröklődés (`is ERC721`), külső könyvtár használata (OpenZeppelin), tulajdonjog-alapú jogosultság (`ownerOf`) a sima `bool` helyett, és NFT-metaadat. Ez a rész teszi a portfóliót igazán erőssé.

**Szakasz-DoD:** meghíváskor NFT mintelődik a vendégnek · a check-in a token tulajdonjogán alapul · a token egyszer használható · tesztek zöldek · deploy + frontend frissítve · (opcionálisan) látszik a wallet/Etherscan NFT-fülén.

> **Következő lépés (V3, opcionális):** tedd a meghívót **soulbound**-dá (nem átruházható) – az átruházó függvények letiltásával. Részletek: [docs/nft.md](docs/nft.md).

---

## Gyors referencia – parancsok

```bash
# Contract
npx hardhat compile           # fordítás
npx hardhat test              # unit tesztek
npx hardhat run scripts/deploy.ts --network sepolia   # deploy

# Frontend (web/ mappából)
npm run dev                   # fejlesztői szerver
npm run build                 # production build
```

## Hivatalos dokumentációk
- Ethereum fejlesztőknek: https://ethereum.org/developers/docs/
- Solidity: https://docs.soliditylang.org/
- Hardhat: https://hardhat.org/docs/getting-started
- viem: https://viem.sh/docs/getting-started
- wagmi: https://wagmi.sh/
- OpenZeppelin (ERC-721): https://docs.openzeppelin.com/contracts/erc721

---

## Tippek kezdőként
- **Egyszerre egy szakasz.** Ne kezdj frontendet, amíg a contract + tesztek nincsenek zölden.
- **Commitolj sűrűn**, szakaszonként legalább egyszer – így bármikor visszaléphetsz.
- **Először mindig olvasás, utána írás.** Ha az olvasás (`view`) megy a UI-ban, az írás (tranzakció) már csak egy lépés.
- **NFT-t ne most.** A PDF terv szerint az NFT/soulbound változat V2/V3 – előbb tanuld meg az állapotkezelést.
- **A privát kulcs / seed szent.** Csak tesztwallet, soha ne gitbe, soha ne valódi pénzzel.
