import type { Address } from "viem";
import { isAddress } from "viem";

const contractAddress = process.env.NEXT_PUBLIC_CHAININVITE_ADDRESS ?? "";

if (contractAddress !== "" && !isAddress(contractAddress)) {
  throw new Error("Invalid NEXT_PUBLIC_CHAININVITE_ADDRESS");
}

export const chainInviteAddress = contractAddress as Address;
export const hasChainInviteAddress = contractAddress !== "";
export const chainInviteChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");
export const chainInviteDeploymentBlock = BigInt(
  process.env.NEXT_PUBLIC_CHAININVITE_DEPLOYMENT_BLOCK ?? "11097427",
);

export const chainInviteAbi = [
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
      { name: "timestamp", type: "uint256", indexed: false, internalType: "uint256" },
    ],
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
    name: "events",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "organizer", type: "address", internalType: "address" },
      { name: "active", type: "bool", internalType: "bool" },
    ],
  },
  {
    type: "function",
    name: "invited",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
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
    name: "createEvent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
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
    outputs: [],
  },
  {
    type: "function",
    name: "inviteMany",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256", internalType: "uint256" },
      { name: "guests", type: "address[]", internalType: "address[]" },
    ],
    outputs: [],
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
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ChainInvite.Event",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          { name: "startTime", type: "uint256", internalType: "uint256" },
          { name: "organizer", type: "address", internalType: "address" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
  },
] as const;
