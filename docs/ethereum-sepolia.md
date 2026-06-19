# Ethereum, Sepolia testnet és az RPC

## Mi ez?
Az **Ethereum** egy decentralizált blockchain: egy világméretű, megosztott "adatbázis + számítógép", amit nem egy cég működtet. Programokat (*smart contract*) lehet ráfeltölteni, amik utána mindenki számára ugyanúgy, megváltoztathatatlanul futnak.

A **Sepolia** az Ethereum egyik hivatalos **teszthálózata (testnet)**: ugyanúgy működik, mint az éles Ethereum, de a rajta lévő ETH **értéktelen, ingyenes** (faucetből szerezhető). Hibázni, kísérletezni, újradeployolni következmény nélkül lehet.

Az **RPC URL** (pl. Alchemy vagy Infura) az a "telefonszám", amin keresztül a kódod beszél a hálózattal: ezen küldöd a tranzakciókat és kérdezed le az adatokat. Saját node helyett ingyenes szolgáltatótól kapsz egyet.

## Miért ezt használjuk?
- **Tanuláshoz ideális:** valódi blockchain-élmény, de nulla pénzügyi kockázat.
- **Sepolia a jelenleg ajánlott Ethereum testnet**, jól támogatott faucetekkel és eszközökkel.
- **EVM-kompatibilis:** amit itt megtanulsz, az átvihető bármely más EVM-láncra (Polygon, Base, Arbitrum stb.).

## Mi a funkciója a ChainInvite-ban?
- Itt **él a deployolt `ChainInvite.sol` szerződés** – ezen tárolódnak az események, meghívók és check-inek.
- A check-in tranzakciók ide kerülnek, és innen olvassa a frontend a meghívók állapotát.
- A deployhoz és tranzakciókhoz innen kell **teszt-ETH** (gas fizetésére) és egy **RPC URL**.

## Pár alapfogalom
- **Gas:** minden állapotváltoztató művelet (írás) díja. Olvasás (`view`) ingyenes.
- **Tranzakció:** aláírt művelet, ami megváltoztatja a lánc állapotát (pl. egy check-in).
- **Block explorer:** [sepolia.etherscan.io](https://sepolia.etherscan.io) – itt megnézheted a contractod és tranzakcióid.
- **Faucet:** ingyenes teszt-ETH-t osztó oldal.

## Kapcsolódás
A [viem](viem.md)/[wagmi](wagmi.md) az RPC-n keresztül beszél a Sepoliával; a [Hardhat](hardhat.md) is RPC-n deployol; a [MetaMask](metamask-wallet.md) írja alá a tranzakciókat.

## Hivatalos dokumentáció
- https://ethereum.org/developers/docs/
- https://sepolia.etherscan.io
