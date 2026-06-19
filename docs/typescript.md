# TypeScript

## Mi ez?
A **TypeScript** a JavaScript **típusokkal kiegészített** változata. Ugyanaz, mint a JavaScript, de minden értéknek megadhatod (vagy a fordító kitalálja) a típusát – és már *írás közben*, a böngésző elindítása előtt jelzi a hibákat. Lefordítva sima JavaScript lesz belőle.

## Miért ezt használjuk?
- **Kevesebb hiba:** elgépelések, rossz típusú adatok már szerkesztés közben kiderülnek.
- **Jobb fejlesztői élmény:** automatikus kiegészítés, dokumentáció a szerkesztőben.
- **A stack erre épül:** a [viem](viem.md) és [wagmi](wagmi.md) kifejezetten TypeScript-first könyvtárak – a contract-hívások típusai segítenek, hogy ne hívj rossz paraméterrel.
- **Blockchainnél kritikus:** wallet címek, számok, ABI-k pontossága – a típusok itt valódi védőháló.

## Mi a funkciója a ChainInvite-ban?
- A teljes **frontend** (Next.js oldalak, komponensek) TypeScriptben íródik.
- A **Hardhat tesztek és scriptek** (`test/`, `scripts/deploy.ts`) is TypeScriptben vannak.
- Segít helyesen kezelni a contract adattípusait (pl. `address`, `uint256` → `bigint`).

## Kulcsfogalmak
- **Típus-annotáció:** `const id: number = 1`.
- **Interface / type:** saját adatszerkezetek leírása (pl. egy esemény alakja a frontenden).
- **bigint:** a Solidity nagy egész számai (pl. timestamp, eventId) a frontenden gyakran `bigint`-ként jönnek.
- **`.ts` / `.tsx`:** sima logika / React-komponenst tartalmazó fájl.

## Kapcsolódás
A [Next.js](nextjs.md), [Hardhat](hardhat.md), [viem](viem.md) és [wagmi](wagmi.md) mind TypeScripttel a legkényelmesebb – ez a közös nyelv a teljes projekten át (a Solidity kivételével).

## Hivatalos dokumentáció
- https://www.typescriptlang.org/docs/
