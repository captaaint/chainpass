# ChainEvents

ChainEvents is the planned paid ticketing subproject inside ChainPass.

This directory is intentionally a scaffold for now. The first implementation milestone will add a public paid ticketing MVP:

- organizers create paid events
- organizers set ticket price, max supply, start time, end time, and treasury address
- any buyer can purchase a ticket with ETH
- the buyer pays the purchase transaction gas
- each purchase mints a transferable ERC-721 ticket NFT
- scanner check-in validates the ticket token and marks it as used

The first MVP will not include allowlists, platform fees, refunds, resale logic, or organizer-selectable transfer rules. Those are later milestones.
