import type { Address } from "viem";
import { isAddress } from "viem";

const nftContractAddress =
  process.env.NEXT_PUBLIC_CHAININVITE_NFT_ADDRESS ??
  "0x2993789b32cdbee343c3f2ee6371f39e824b6f61";

if (nftContractAddress !== "" && !isAddress(nftContractAddress)) {
  throw new Error("Invalid NEXT_PUBLIC_CHAININVITE_NFT_ADDRESS");
}

export const chainInviteNftAddress = nftContractAddress as Address;
export const hasChainInviteNftAddress = nftContractAddress !== "";
export const chainInviteNftChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");
export const chainInviteNftDeploymentBlock = BigInt(
  process.env.NEXT_PUBLIC_CHAININVITE_NFT_DEPLOYMENT_BLOCK ?? "11100949",
);

export const chainInviteNftAbi = [
  {
    type: "event",
    name: "EventCreated",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "organizer", type: "address", indexed: false, internalType: "address" },
      { name: "name", type: "string", indexed: false, internalType: "string" },
      { name: "startTime", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "EventDeleted",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "organizer", type: "address", indexed: false, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "GuestInvited",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "guest", type: "address", indexed: false, internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "InviteMinted",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "guest", type: "address", indexed: false, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ScannerUpdated",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "scanner", type: "address", indexed: false, internalType: "address" },
      { name: "allowed", type: "bool", indexed: false, internalType: "bool" },
    ],
  },
  {
    type: "event",
    name: "GuestCheckedIn",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "guest", type: "address", indexed: false, internalType: "address" },
      { name: "scanner", type: "address", indexed: false, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
  },
  {
    type: "function",
    name: "eventCounter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "createEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "inviteGuest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "guest", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "setScanner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "scanner", type: "address", internalType: "address" },
      { name: "allowed", type: "bool", internalType: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "checkIn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "guest", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deleteEvent",
    stateMutability: "nonpayable",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "isValidInvite",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "guest", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "isValidToken",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "guest", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "guestToken",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "checkedIn",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "scannerAllowed",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "tokenEvent",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "tokenUsed",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ChainInviteNFT.Event",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "endTime", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
  },
] as const;
