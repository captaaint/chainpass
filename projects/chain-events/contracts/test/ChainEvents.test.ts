import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { anyValue } from "@nomicfoundation/hardhat-viem-assertions/predicates";
import { network } from "hardhat";
import { parseEther } from "viem";

type EventData = {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  ticketPrice: bigint;
  maxSupply: bigint;
  sold: bigint;
  organizer: string;
  treasury: string;
  active: boolean;
};

describe("ChainEvents", async function () {
  const { viem } = await network.create();
  const [organizer, buyer, scanner, stranger, recipient, treasury] =
    await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const ticketPrice = parseEther("0.05");
  const startTime = 0n;
  const endTime = 4_102_444_800n; // 2100, far enough in the future for tests.

  async function deployWithEvent(maxSupply = 10n) {
    const chainEvents = await viem.deployContract("ChainEvents");

    await chainEvents.write.createEvent([
      "Paid meetup",
      "Public paid event",
      startTime,
      endTime,
      ticketPrice,
      maxSupply,
      treasury.account.address,
    ]);

    return { chainEvents, eventId: 1n };
  }

  it("deploys with the expected ERC-721 name and symbol", async function () {
    const chainEvents = await viem.deployContract("ChainEvents");

    assert.equal(await chainEvents.read.name(), "ChainPass Event Ticket");
    assert.equal(await chainEvents.read.symbol(), "CPASS");
    assert.equal(await chainEvents.read.nextTokenId(), 1n);
  });

  it("creates a paid event with organizer, pricing, supply, and treasury data", async function () {
    const chainEvents = await viem.deployContract("ChainEvents");

    await viem.assertions.emitWithArgs(
      chainEvents.write.createEvent([
        "Paid meetup",
        "Public paid event",
        startTime,
        endTime,
        ticketPrice,
        25n,
        treasury.account.address,
      ]),
      chainEvents,
      "EventCreated",
      [
        1n,
        organizer.account.address,
        "Paid meetup",
        startTime,
        endTime,
        ticketPrice,
        25n,
        treasury.account.address,
      ],
    );

    const eventData = (await chainEvents.read.getEvent([1n])) as EventData;

    assert.equal(eventData.name, "Paid meetup");
    assert.equal(eventData.description, "Public paid event");
    assert.equal(eventData.startTime, startTime);
    assert.equal(eventData.endTime, endTime);
    assert.equal(eventData.ticketPrice, ticketPrice);
    assert.equal(eventData.maxSupply, 25n);
    assert.equal(eventData.sold, 0n);
    assert.equal(eventData.organizer.toLowerCase(), organizer.account.address.toLowerCase());
    assert.equal(eventData.treasury.toLowerCase(), treasury.account.address.toLowerCase());
    assert.equal(eventData.active, true);
  });

  it("rejects invalid event settings", async function () {
    const chainEvents = await viem.deployContract("ChainEvents");

    await viem.assertions.revertWith(
      chainEvents.write.createEvent([
        "",
        "desc",
        startTime,
        endTime,
        ticketPrice,
        10n,
        treasury.account.address,
      ]),
      "name required",
    );
    await viem.assertions.revertWith(
      chainEvents.write.createEvent([
        "Bad time",
        "desc",
        100n,
        99n,
        ticketPrice,
        10n,
        treasury.account.address,
      ]),
      "endTime before startTime",
    );
    await viem.assertions.revertWith(
      chainEvents.write.createEvent([
        "Free",
        "desc",
        startTime,
        endTime,
        0n,
        10n,
        treasury.account.address,
      ]),
      "ticket price required",
    );
    await viem.assertions.revertWith(
      chainEvents.write.createEvent([
        "No supply",
        "desc",
        startTime,
        endTime,
        ticketPrice,
        0n,
        treasury.account.address,
      ]),
      "max supply required",
    );
    await viem.assertions.revertWith(
      chainEvents.write.createEvent([
        "No treasury",
        "desc",
        startTime,
        endTime,
        ticketPrice,
        10n,
        "0x0000000000000000000000000000000000000000",
      ]),
      "treasury required",
    );
  });

  it("lets any buyer purchase a transferable ticket and forwards ETH to treasury", async function () {
    const { chainEvents, eventId } = await deployWithEvent();
    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    await viem.assertions.emitWithArgs(
      chainEvents.write.buyTicket([eventId], {
        account: buyer.account,
        value: ticketPrice,
      }),
      chainEvents,
      "TicketPurchased",
      [eventId, 1n, buyer.account.address, ticketPrice, treasury.account.address],
    );

    assert.equal(
      ((await chainEvents.read.ownerOf([1n])) as string).toLowerCase(),
      buyer.account.address.toLowerCase(),
    );
    assert.equal(await chainEvents.read.tokenEvent([1n]), eventId);

    const eventData = (await chainEvents.read.getEvent([eventId])) as EventData;
    assert.equal(eventData.sold, 1n);

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });
    assert.equal(treasuryAfter - treasuryBefore, ticketPrice);

    await chainEvents.write.transferFrom(
      [buyer.account.address, recipient.account.address, 1n],
      { account: buyer.account },
    );

    assert.equal(
      ((await chainEvents.read.ownerOf([1n])) as string).toLowerCase(),
      recipient.account.address.toLowerCase(),
    );
  });

  it("rejects purchases with the wrong price, inactive events, expired events, and sold-out supply", async function () {
    const { chainEvents, eventId } = await deployWithEvent(1n);

    await viem.assertions.revertWith(
      chainEvents.write.buyTicket([eventId], {
        account: buyer.account,
        value: ticketPrice - 1n,
      }),
      "wrong ticket price",
    );

    await chainEvents.write.buyTicket([eventId], {
      account: buyer.account,
      value: ticketPrice,
    });

    await viem.assertions.revertWith(
      chainEvents.write.buyTicket([eventId], {
        account: stranger.account,
        value: ticketPrice,
      }),
      "sold out",
    );

    const expired = await viem.deployContract("ChainEvents");
    await expired.write.createEvent([
      "Expired",
      "desc",
      0n,
      1n,
      ticketPrice,
      1n,
      treasury.account.address,
    ]);

    await viem.assertions.revertWith(
      expired.write.buyTicket([1n], {
        account: buyer.account,
        value: ticketPrice,
      }),
      "event ended",
    );

    const deleted = await viem.deployContract("ChainEvents");
    await deleted.write.createEvent([
      "Deleted",
      "desc",
      startTime,
      endTime,
      ticketPrice,
      1n,
      treasury.account.address,
    ]);
    await deleted.write.deleteEvent([1n]);

    await viem.assertions.revertWith(
      deleted.write.buyTicket([1n], {
        account: buyer.account,
        value: ticketPrice,
      }),
      "event inactive",
    );
  });

  it("allows the organizer to approve scanners and rejects non-organizer scanner updates", async function () {
    const { chainEvents, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainEvents.write.setScanner([eventId, scanner.account.address, true]),
      chainEvents,
      "ScannerUpdated",
      [eventId, scanner.account.address, true],
    );

    assert.equal(
      await chainEvents.read.scannerAllowed([eventId, scanner.account.address]),
      true,
    );

    await viem.assertions.revertWith(
      chainEvents.write.setScanner([eventId, stranger.account.address, true], {
        account: stranger.account,
      }),
      "not organizer",
    );
  });

  it("checks in the current ticket owner and marks the token as used", async function () {
    const { chainEvents, eventId } = await deployWithEvent();

    await chainEvents.write.buyTicket([eventId], {
      account: buyer.account,
      value: ticketPrice,
    });
    await chainEvents.write.transferFrom(
      [buyer.account.address, recipient.account.address, 1n],
      { account: buyer.account },
    );

    await viem.assertions.emitWithArgs(
      chainEvents.write.checkIn([eventId, 1n]),
      chainEvents,
      "TicketCheckedIn",
      [eventId, 1n, recipient.account.address, organizer.account.address, anyValue],
    );

    assert.equal(await chainEvents.read.tokenUsed([1n]), true);
    assert.equal(await chainEvents.read.isValidTicket([eventId, 1n]), false);
  });

  it("allows an approved scanner to check in a ticket", async function () {
    const { chainEvents, eventId } = await deployWithEvent();

    await chainEvents.write.buyTicket([eventId], {
      account: buyer.account,
      value: ticketPrice,
    });
    await chainEvents.write.setScanner([eventId, scanner.account.address, true]);

    await viem.assertions.emitWithArgs(
      chainEvents.write.checkIn([eventId, 1n], {
        account: scanner.account,
      }),
      chainEvents,
      "TicketCheckedIn",
      [eventId, 1n, buyer.account.address, scanner.account.address, anyValue],
    );
  });

  it("rejects unauthorized, wrong-event, duplicate, and inactive check-ins", async function () {
    const { chainEvents, eventId } = await deployWithEvent();

    await chainEvents.write.buyTicket([eventId], {
      account: buyer.account,
      value: ticketPrice,
    });

    await viem.assertions.revertWith(
      chainEvents.write.checkIn([eventId, 1n], {
        account: stranger.account,
      }),
      "not allowed",
    );

    await viem.assertions.revertWith(
      chainEvents.write.checkIn([eventId, 999n]),
      "wrong event token",
    );

    await chainEvents.write.checkIn([eventId, 1n]);

    await viem.assertions.revertWith(
      chainEvents.write.checkIn([eventId, 1n]),
      "token already used",
    );

    const deleted = await viem.deployContract("ChainEvents");
    await deleted.write.createEvent([
      "Deleted",
      "desc",
      startTime,
      endTime,
      ticketPrice,
      1n,
      treasury.account.address,
    ]);
    await deleted.write.buyTicket([1n], {
      account: buyer.account,
      value: ticketPrice,
    });
    await deleted.write.deleteEvent([1n]);

    await viem.assertions.revertWith(
      deleted.write.checkIn([1n, 1n]),
      "event inactive",
    );
  });

  it("reports ticket validity and returns data URI metadata", async function () {
    const { chainEvents, eventId } = await deployWithEvent();

    await chainEvents.write.buyTicket([eventId], {
      account: buyer.account,
      value: ticketPrice,
    });

    assert.equal(await chainEvents.read.isValidTicket([eventId, 1n]), true);

    const tokenUri = (await chainEvents.read.tokenURI([1n])) as string;
    const encodedJson = tokenUri.replace("data:application/json;base64,", "");
    const metadata = JSON.parse(Buffer.from(encodedJson, "base64").toString("utf8")) as {
      name: string;
      description: string;
      attributes: unknown[];
    };

    assert.equal(metadata.name, "ChainPass Ticket #1");
    assert.equal(metadata.description, "Transferable ChainPass event ticket.");
    assert.equal(Array.isArray(metadata.attributes), true);
  });
});
