import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Address } from "viem";

import { normalizeAddress } from "@/lib/format";

export type EventIndexVariant = "base" | "nft";

export type IndexedGuest = {
  guest: Address;
  blockNumber: string;
  tokenId?: string;
};

export type IndexedScanner = {
  scanner: Address;
  allowed: boolean;
  blockNumber: string;
};

export type IndexedEventState = {
  eventId: string;
  active: boolean;
  cursor: string;
  refreshedAt: string | null;
  guests: IndexedGuest[];
  scanners: IndexedScanner[];
  checkedIn: Address[];
};

type StoredCheckIn = {
  guest: Address;
  blockNumber: string;
};

type StoredEvent = {
  active: boolean;
  guests: Record<string, IndexedGuest>;
  scanners: Record<string, IndexedScanner>;
  checkedIn: Record<string, StoredCheckIn>;
};

type StoredNamespace = {
  cursor: string;
  refreshedAt: string | null;
  lockedUntil: number;
  events: Record<string, StoredEvent>;
};

type StoreData = {
  namespaces: Record<EventIndexVariant, StoredNamespace>;
};

type EventPatch = {
  eventId: bigint;
  guest?: Address;
  scanner?: Address;
  allowed?: boolean;
  checkedInGuest?: Address;
  tokenId?: bigint;
  deleted?: boolean;
  blockNumber: bigint;
};

const STORE_PATH = path.join(process.cwd(), ".chaininvite-cache.json");
const STORE_VERSION = 1;

function emptyNamespace(): StoredNamespace {
  return {
    cursor: "0",
    refreshedAt: null,
    lockedUntil: 0,
    events: {},
  };
}

function emptyStore(): StoreData {
  return {
    namespaces: {
      base: emptyNamespace(),
      nft: emptyNamespace(),
    },
  };
}

function ensureNamespace(store: StoreData, variant: EventIndexVariant) {
  store.namespaces[variant] ??= emptyNamespace();
  return store.namespaces[variant];
}

function ensureEvent(namespace: StoredNamespace, eventId: string) {
  namespace.events[eventId] ??= {
    active: true,
    guests: {},
    scanners: {},
    checkedIn: {},
  };
  return namespace.events[eventId];
}

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData> & { version?: number };
    const store = emptyStore();

    store.namespaces = {
      ...store.namespaces,
      ...(parsed.namespaces ?? {}),
    };

    return store;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyStore();
    }

    throw error;
  }
}

async function writeStore(store: StoreData) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tempPath = `${STORE_PATH}.tmp`;
  await writeFile(tempPath, JSON.stringify({ version: STORE_VERSION, ...store }, null, 2));
  await rename(tempPath, STORE_PATH);
}

export async function getIndexCursor(variant: EventIndexVariant) {
  const store = await readStore();
  return BigInt(ensureNamespace(store, variant).cursor);
}

export async function acquireIndexLock(variant: EventIndexVariant, ttlMs = 30_000) {
  const store = await readStore();
  const namespace = ensureNamespace(store, variant);
  const now = Date.now();

  if (namespace.lockedUntil > now) {
    return false;
  }

  namespace.lockedUntil = now + ttlMs;
  await writeStore(store);
  return true;
}

export async function releaseIndexLock(variant: EventIndexVariant) {
  const store = await readStore();
  const namespace = ensureNamespace(store, variant);
  namespace.lockedUntil = 0;
  await writeStore(store);
}

export async function mergeEventIndexPatches({
  variant,
  patches,
  cursor,
}: {
  variant: EventIndexVariant;
  patches: EventPatch[];
  cursor: bigint;
}) {
  const store = await readStore();
  const namespace = ensureNamespace(store, variant);

  for (const patch of patches) {
    const event = ensureEvent(namespace, patch.eventId.toString());
    const blockNumber = patch.blockNumber.toString();

    if (patch.guest) {
      event.guests[normalizeAddress(patch.guest)] = {
        guest: patch.guest,
        blockNumber,
        ...(patch.tokenId === undefined ? {} : { tokenId: patch.tokenId.toString() }),
      };
    }

    if (patch.scanner) {
      event.scanners[normalizeAddress(patch.scanner)] = {
        scanner: patch.scanner,
        allowed: Boolean(patch.allowed),
        blockNumber,
      };
    }

    if (patch.checkedInGuest) {
      event.checkedIn[normalizeAddress(patch.checkedInGuest)] = {
        guest: patch.checkedInGuest,
        blockNumber,
      };
    }

    if (patch.deleted) {
      event.active = false;
    }
  }

  namespace.cursor = cursor.toString();
  namespace.refreshedAt = new Date().toISOString();
  await writeStore(store);
}

export async function getIndexedEventState(
  variant: EventIndexVariant,
  eventId: string,
): Promise<IndexedEventState> {
  const store = await readStore();
  const namespace = ensureNamespace(store, variant);
  const event = namespace.events[eventId];

  return {
    eventId,
    active: event?.active ?? true,
    cursor: namespace.cursor,
    refreshedAt: namespace.refreshedAt,
    guests: Object.values(event?.guests ?? {}).sort((left, right) =>
      BigInt(left.blockNumber) === BigInt(right.blockNumber)
        ? normalizeAddress(left.guest).localeCompare(normalizeAddress(right.guest))
        : BigInt(left.blockNumber) < BigInt(right.blockNumber)
          ? -1
          : 1,
    ),
    scanners: Object.values(event?.scanners ?? {}).sort((left, right) =>
      normalizeAddress(left.scanner).localeCompare(normalizeAddress(right.scanner)),
    ),
    checkedIn: Object.values(event?.checkedIn ?? {}).map((entry) => entry.guest),
  };
}
