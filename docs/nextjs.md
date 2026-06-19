# Next.js

## Mi ez?
A **Next.js** egy React-alapú webes keretrendszer. Megadja a projekt vázát: oldal-routingot (URL → oldal), fejlesztői szervert élő újratöltéssel, build- és deploy-folyamatot. A modern Next.js az **App Router** mintát használja, ahol a `app/` mappa szerkezete adja az URL-eket.

## Miért ezt használjuk?
- **Gyors indulás:** egy paranccsal kész a teljes frontend-projektváz (`create-next-app`).
- **Fájl-alapú routing:** a ChainInvite oldalai (`/admin`, `/invite/[eventId]`, `/scanner/[eventId]`) egyszerűen mappákként jönnek létre.
- **Dinamikus útvonalak:** a `[eventId]` szegmens pont az esemény-azonosítós oldalakhoz kell.
- **Könnyű deploy:** pár kattintással felmegy Vercelre HTTPS-en (a kamerás scannerhez ez kötelező).

## Mi a funkciója a ChainInvite-ban?
Ez adja a teljes felhasználói felületet és az oldalstruktúrát:
- `/admin`, `/admin/events/new`, `/admin/events/[id]` – szervezői dashboard.
- `/invite/[eventId]` – vendég meghívó oldala QR-kóddal.
- `/scanner/[eventId]` – beléptető oldal kamerával.

A blockchain-logikát nem maga a Next.js intézi – ő a "keret", amibe a [wagmi](wagmi.md)/[viem](viem.md) hívásai és a [Tailwind](tailwind.md) stílusok kerülnek.

## Kulcsfogalmak
- **App Router (`app/` mappa):** mappa = útvonal, `page.tsx` = az adott oldal.
- **Dinamikus szegmens `[eventId]`:** változó rész az URL-ben.
- **Client component (`"use client"`):** a wallet- és kamera-interakciókhoz kell, mert ezek a böngészőben futnak.
- **`npm run dev` / `build`:** fejlesztői szerver / production build.

## Kapcsolódás
A Next.js a [TypeScript](typescript.md) nyelven íródik, [Tailwind](tailwind.md)-del stílusozva, és a [wagmi](wagmi.md)-n keresztül beszél a [Sepolia](ethereum-sepolia.md)-n élő contracttal.

## Hivatalos dokumentáció
- https://nextjs.org/docs
