# Hardhat

## Mi ez?
A **Hardhat** egy fejlesztői környezet smart contractokhoz – a Solidity-fejlesztés "svájci bicskája". Egyetlen eszközben elintézi a **fordítást, tesztelést, lokális blockchain futtatását, a deployt és a debuggolást**. A saját gépeden fut (Node.js-re épül), és TypeScripttel konfigurálható.

## Miért ezt használjuk?
- **Mindent egy helyen ad:** nem kell külön eszközöket összerakni.
- **Beépített lokális hálózat:** azonnali, ingyenes teszteléshez – nem kell hozzá testnet.
- **Kiváló tesztkörnyezet:** JavaScript/TypeScript tesztek, amik gyorsan futnak és olvashatóak.
- **Nagy ökoszisztéma és dokumentáció**, kezdőbarát.

## Mi a funkciója a ChainInvite-ban?
- **Fordítás:** `npx hardhat compile` – a `ChainInvite.sol`-ból gépi kód + ABI lesz.
- **Tesztelés:** `npx hardhat test` – futtatja a `test/ChainInvite.test.ts` unit teszteket (jogosultságok, egyszer-használatosság, hibás esetek).
- **Lokális lánc:** villámgyors próbákhoz, mielőtt testnetre mész.
- **Deploy:** a `scripts/deploy.ts` a [Sepolia](ethereum-sepolia.md) hálózatra tölti fel a contractot.
- **ABI-forrás:** az `artifacts/` mappából veszi a frontend a contract "használati utasítását".

## Kulcsfogalmak
- **compile:** Solidity → EVM bytecode + ABI.
- **ABI:** JSON leírás arról, milyen függvényei/eseményei vannak a contractnak (a frontend ezt használja).
- **artifacts/ és cache/:** generált fájlok (gitbe nem kerülnek).
- **hardhat.config.ts:** itt állítod be a Solidity verziót, a hálózatokat (Sepolia RPC + account).

## Kapcsolódás
A Hardhat a [Solidity](solidity.md)-kódot kezeli, a [Sepolia](ethereum-sepolia.md)-ra deployol [RPC](ethereum-sepolia.md)-n keresztül, és az általa generált ABI-t használja a [wagmi](wagmi.md)/[viem](viem.md) a frontenden.

## Hivatalos dokumentáció
- https://hardhat.org/docs/getting-started
