# ChainEvents

ChainEvents is the paid ticketing subproject inside ChainPass.

The current contract MVP implements public paid ticketing:

- organizers create paid events
- organizers set ticket price, max supply, start time, end time, and treasury address
- any buyer can purchase a ticket with ETH
- the buyer pays the purchase transaction gas
- each purchase mints a transferable ERC-721 ticket NFT
- scanner check-in validates the ticket token and marks it as used

The first MVP will not include allowlists, platform fees, refunds, resale logic, or organizer-selectable transfer rules. Those are later milestones.

## Structure

```text
chain-events/
├── contracts/
│   ├── contracts/ChainEvents.sol
│   ├── scripts/deploy.ts
│   ├── test/ChainEvents.test.ts
│   ├── hardhat.config.ts
│   └── package.json
├── package.json
└── README.md
```

## Contract Model

`ChainEvents.sol` is an ERC-721 ticket contract.

Event organizers create an event with:

- name
- description
- start time
- end time
- ticket price
- max supply
- treasury address

Buyers call `buyTicket(eventId)` and must send exactly the configured ticket price. The contract mints one transferable ticket NFT to the buyer and forwards the ETH to the event treasury.

Check-in is token-based. The organizer or an approved scanner calls `checkIn(eventId, tokenId)`. The contract validates that the token belongs to the event, the event is active and within its time window, and the token has not already been used. Because tickets are transferable, the current token owner is treated as the attendee.

## Commands

Install dependencies from this subproject:

```bash
npm install
```

Compile:

```bash
npm run compile
```

Test:

```bash
npm test
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```
