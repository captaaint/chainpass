# Tailwind CSS

## Mi ez?
A **Tailwind CSS** egy "utility-first" stíluskönyvtár. Külön CSS-fájlok írása helyett kész apró osztályokat (pl. `flex`, `p-4`, `text-center`, `rounded-lg`) raksz közvetlenül a HTML/JSX elemekre, és ezekből rakod össze a kinézetet.

## Miért ezt használjuk?
- **Gyors:** nem kell külön CSS-fájlokat szervezni, a stílus ott van az elem mellett.
- **Konzisztens:** előre definiált skálák (térköz, szín, méret) → egységes, rendezett UI kevés döntéssel.
- **Next.js-szel együtt jön:** a `create-next-app` fel tudja telepíteni egyből.
- **Opcionálisan shadcn/ui:** Tailwindre épülő kész komponensek (gombok, űrlapok) gyorsabb, letisztult admin/scanner felülethez.

## Mi a funkciója a ChainInvite-ban?
- A teljes felület **kinézetét** ez adja: admin dashboard, meghívó oldal, scanner felület.
- **Állapot-visszajelzések** stílusozása: zöld "érvényes meghívó", piros "már felhasznált", betöltés-jelzők.
- **Reszponzivitás:** a scanner oldal telefonon is jól nézzen ki (a kamera miatt fontos).

## Kulcsfogalmak
- **Utility osztály:** egy apró, egy dolgot csináló class (pl. `mt-2` = margó felül).
- **Reszponzív prefix:** `md:`, `lg:` – képernyőméret szerinti megjelenés.
- **Állapot-prefix:** `hover:`, `disabled:` – interakciós állapotok.

## Kapcsolódás
A Tailwind csak a megjelenésért felel a [Next.js](nextjs.md) + [TypeScript](typescript.md) komponensekben; a blockchain-logikához (wagmi/viem) semmi köze – tisztán a UI rétege.

## Hivatalos dokumentáció
- https://tailwindcss.com/docs
- https://ui.shadcn.com/ (opcionális komponenskönyvtár)
