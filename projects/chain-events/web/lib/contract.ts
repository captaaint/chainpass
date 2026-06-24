import { isAddress, type Address } from "viem";
import { sepolia } from "wagmi/chains";

const configuredAddress = process.env.NEXT_PUBLIC_CHAIN_EVENTS_ADDRESS;
const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? sepolia.id);
const configuredDeploymentBlock =
  process.env.NEXT_PUBLIC_CHAIN_EVENTS_DEPLOYMENT_BLOCK ??
  process.env.NEXT_PUBLIC_CHAIN_EVENTS_DEPLOY_BLOCK ??
  "0";

export const hasChainEventsAddress = Boolean(
  configuredAddress && isAddress(configuredAddress),
);

export const chainEventsAddress = (
  hasChainEventsAddress ? configuredAddress : "0x0000000000000000000000000000000000000000"
) as Address;

export const chainEventsChainId = configuredChainId;
export const chainEventsDeploymentBlock = BigInt(configuredDeploymentBlock);

export const chainEventsAbi = [
  {
    type: "event",
    name: "EventCreated",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false },
      { name: "organizer", type: "address", indexed: false },
      { name: "name", type: "string", indexed: false },
      { name: "startTime", type: "uint256", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
      { name: "ticketPrice", type: "uint256", indexed: false },
      { name: "maxSupply", type: "uint256", indexed: false },
      { name: "treasury", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EventDeleted",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false },
      { name: "organizer", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TicketPurchased",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false },
      { name: "buyer", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
      { name: "treasury", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ScannerUpdated",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false },
      { name: "scanner", type: "address", indexed: false },
      { name: "allowed", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TicketCheckedIn",
    anonymous: false,
    inputs: [
      { name: "eventId", type: "uint256", indexed: false },
      { name: "tokenId", type: "uint256", indexed: false },
      { name: "attendee", type: "address", indexed: false },
      { name: "scanner", type: "address", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "eventCounter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "ticketPrice", type: "uint256" },
          { name: "maxSupply", type: "uint256" },
          { name: "sold", type: "uint256" },
          { name: "organizer", type: "address" },
          { name: "treasury", type: "address" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "tokenEvent",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenUsed",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "scannerAllowed",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "scanner", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isValidTicket",
    stateMutability: "view",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "createEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "ticketPrice", type: "uint256" },
      { name: "maxSupply", type: "uint256" },
      { name: "treasury", type: "address" },
    ],
    outputs: [{ name: "eventId", type: "uint256" }],
  },
  {
    type: "function",
    name: "buyTicket",
    stateMutability: "payable",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "setScanner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "scanner", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "checkIn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deleteEvent",
    stateMutability: "nonpayable",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [],
  },
] as const;
