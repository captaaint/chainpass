# QR-kódok: qrcode + html5-qrcode

A ChainInvite-ban két különböző feladat van, ezért két könyvtár:
**generálás** (vendégoldal) és **olvasás** (scanner). A kettő nem ugyanaz.

---

## qrcode – QR generálás

### Mi ez?
A **qrcode** egy egyszerű JavaScript-könyvtár, amellyel adatból (szöveg/JSON) QR-kód képet készítesz a böngészőben.

### Miért ezt használjuk?
- Pici, egyszerű, pont annyit tud, amennyi kell.
- Böngészőben fut, nem kell hozzá szerver.

### Funkciója a ChainInvite-ban
A `/invite/[eventId]` vendégoldalon legenerálja a meghívó QR-kódját. A QR tartalma egy JSON payload:
```json
{ "eventId": 1, "guest": "0x..." }
```
Ezt mutatja a vendég a beléptetésnél, és ezt olvassa be a scanner.

---

## html5-qrcode – QR olvasás (kamera)

### Mi ez?
A **html5-qrcode** (alternatíva: `@zxing/browser`) a böngésző kameráját használva **beolvas és dekódol** QR-kódokat élő képből.

### Miért ezt használjuk?
- Közvetlenül a böngészőből éri el a kamerát – nem kell natív mobilapp.
- Visszaadja a beolvasott szöveget, amit JSON-ként fel tudsz dolgozni.

### Funkciója a ChainInvite-ban
A `/scanner/[eventId]` beléptető oldalon:
1. Megnyitja a kamerát, és figyeli a QR-kódokat.
2. A beolvasott szövegből kinyeri az `eventId` + `guest` értékeket (JSON parse, hibakezeléssel).
3. Innen indul a validáció ([wagmi](wagmi.md) `isValidInvite`), majd siker esetén a `checkIn` tranzakció.

### ⚠️ Fontos
A böngésző csak **HTTPS-en vagy localhoston** ad kamera-hozzáférést. Telefonos teszthez deployolt HTTPS-oldal (pl. Vercel) vagy localhost kell.

---

## A teljes QR-folyamat

```
Vendég oldala (qrcode)              Scanner oldala (html5-qrcode)
─────────────────────              ──────────────────────────────
{eventId, guest}  ──► QR kép  ──►  kamera beolvas ──► JSON parse
                                          │
                                          ▼
                                   isValidInvite?  (olvasás)
                                          │ ha érvényes
                                          ▼
                                   checkIn(...)    (tranzakció)
```

## Kapcsolódás
A QR csak adatot hordoz; az érvényesség eldöntése és a beléptetés a [Solidity](solidity.md) contractban történik, a [wagmi](wagmi.md)/[viem](viem.md) hívásokon át.

## Hivatalos dokumentáció
- qrcode: https://www.npmjs.com/package/qrcode
- html5-qrcode: https://www.npmjs.com/package/html5-qrcode
- @zxing/browser (alternatíva): https://www.npmjs.com/package/@zxing/browser
