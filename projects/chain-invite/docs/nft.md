# NFTs in ChainInvite

An NFT is a non-fungible token: a unique blockchain token with its own `tokenId`. ERC-721 is the common Ethereum standard for NFTs.

## Role in ChainInvite

The base invite model stores a boolean per guest address. The NFT model mints a ticket token to the guest. Check-in is valid when the guest owns the token and the token has not been used.

## Benefits

- The guest owns a visible ticket.
- The ticket can appear in wallet NFT views.
- The implementation demonstrates ERC-721 knowledge.

## Tradeoffs

- More contract code and tests.
- Minting costs more gas than setting a boolean.
- Transferable NFTs may not fit personal invitations.

## Soulbound Tickets

The NFT contract makes tickets soulbound by rejecting transfers. Minting and burning are allowed, but normal transfers are blocked.

## Implementation Outline

1. Use OpenZeppelin ERC-721.
2. Mint a token in `inviteGuest`.
3. Store `tokenEvent`, `tokenUsed`, and `guestToken`.
4. Check ownership with `ownerOf`.
5. Mark `tokenUsed` during check-in.

## Official Documentation

- https://eips.ethereum.org/EIPS/eip-721
- https://docs.openzeppelin.com/contracts/erc721
- https://ethereum.org/en/nft/
