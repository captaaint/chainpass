export type EventStatus = "Active" | "Upcoming";

export type EventSummary = {
  id: string;
  name: string;
  date: string;
  price: string;
  supply: string;
  status: EventStatus;
};

export type TicketSummary = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  variant: "cyan" | "mono" | "gold";
  disabled?: boolean;
  highlighted?: boolean;
};

export const events: EventSummary[] = [
  {
    id: "1",
    name: "Web3 Summit 2024",
    date: "Oct 24, 2024",
    price: "0.05 ETH",
    supply: "142/500",
    status: "Active",
  },
  {
    id: "2",
    name: "NFT Gallery Night",
    date: "Nov 12, 2024",
    price: "0.02 ETH",
    supply: "25/100",
    status: "Upcoming",
  },
];

export const scannerEvents = [
  {
    id: "1",
    name: "DevCon Afterparty",
    detail: "Assigned as Gatekeeper",
    locked: false,
  },
  {
    id: "2",
    name: "Modular Summit",
    detail: "Permission Expired",
    locked: true,
  },
];

export const tickets: TicketSummary[] = [
  {
    id: "08422",
    title: "Neo-Future Tech Summit 2024",
    subtitle: "Sept 14, 2024 • 09:00 AM",
    badge: "Valid",
    variant: "cyan",
  },
  {
    id: "11059",
    title: "Web3 Developers Workshop",
    subtitle: "Aug 02, 2024 • 02:00 PM",
    badge: "Checked In",
    variant: "mono",
    disabled: true,
  },
  {
    id: "00001",
    title: "Blockchain Leaders Gala",
    subtitle: "Oct 21, 2024 • 07:00 PM",
    badge: "VIP Access",
    variant: "gold",
    highlighted: true,
  },
];

export const dashboardTickets = [
  {
    id: "4092",
    title: "EthGlobal Hackathon",
    subtitle: "Brussels • July 12-14",
    badge: "VIP Access",
  },
  {
    id: "0112",
    title: "On-Chain Music Fest",
    subtitle: "Lisbon • Aug 05",
    badge: "General",
  },
];
