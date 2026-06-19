# Solidity

## Mi ez?
A **Solidity** a legelterjedtebb programozási nyelv **smart contractok** (okosszerződések) írására Ethereumon és más EVM-láncokon. Statikusan típusos, C++/JavaScript-szerű szintaxisú nyelv, amely közvetlenül a blockchain "számítógépén" (EVM) futó kódra fordul.

A smart contract egy olyan program, amely a blockchainen él: az állapota (adatok) ott tárolódik, a logikáját pedig bárki meghívhatja, és mindig ugyanúgy fut – senki nem tudja utólag titokban megváltoztatni.

## Miért ezt használjuk?
- **De facto szabvány:** a legtöbb tutorial, könyvtár és eszköz Solidityre épül – kezdőként itt találod a legtöbb segítséget.
- **0.8.x verzió:** beépített túlcsordulás-védelem (overflow check), modern és biztonságos alapok.
- **EVM-kompatibilis:** ugyanaz a contract sok láncon fut.

## Mi a funkciója a ChainInvite-ban?
A teljes üzleti logika Solidityben íródik a `contracts/ChainInvite.sol` fájlba:
- **Adattárolás:** események (`Event` struct), meghívottak, check-in státusz, scanner-jogosultságok (`mapping`-ekben).
- **Szabályok:** ki hozhat létre eseményt, ki hívhat meg vendéget, ki check-inelhet (`require` ellenőrzésekkel).
- **Egyszer-használatosság:** a contract garantálja, hogy egy meghívót csak egyszer lehet beváltani.
- **Eventek (logok):** minden fontos művelet naplózódik, ebből épül a frontend listázása.

## Kulcsfogalmak, amik itt előjönnek
- **struct:** több mező egy egységben (pl. egy esemény adatai).
- **mapping:** kulcs→érték tár (pl. cím → meghívott-e). Nem iterálható!
- **modifier / require:** jogosultság- és feltétel-ellenőrzés.
- **event / emit:** napló a frontendnek.
- **msg.sender:** a függvényt hívó wallet címe – ezen alapul a jogosultság.
- **view:** állapotot nem módosító, ingyenes olvasófüggvény.

## Kapcsolódás
A Solidity-kódot a [Hardhat](hardhat.md) fordítja, teszteli és deployolja a [Sepolia](ethereum-sepolia.md) hálózatra. A frontend a [viem](viem.md)/[wagmi](wagmi.md) révén hívja a függvényeit.

## Hivatalos dokumentáció
- https://docs.soliditylang.org/
