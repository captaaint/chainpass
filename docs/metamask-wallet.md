# MetaMask

MetaMask is the browser wallet used by ChainInvite. It stores wallet keys, exposes the connected address, and asks the user to approve transactions.

## Why ChainInvite Uses It

- It is widely used in Ethereum dApps.
- wagmi supports it through the injected connector.
- It handles Sepolia network switching and transaction approval.

## Role in ChainInvite

- The connected address identifies the organizer, guest, or scanner.
- Write actions such as `createEvent`, `inviteGuest`, and `checkIn` require MetaMask approval.
- Sepolia test ETH in MetaMask pays transaction gas.

## Safety

- Use a separate test wallet.
- Never use real funds for this project.
- Never commit or share a seed phrase or private key.

## Official Documentation

- https://docs.metamask.io/
