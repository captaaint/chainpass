import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { anyValue } from "@nomicfoundation/hardhat-viem-assertions/predicates";
import { network } from "hardhat";

describe("ChainInvite", async function () {
  const { viem } = await network.create();
  const [organizer, guest, scanner, stranger, secondGuest] =
    await viem.getWalletClients();

  async function deployWithEvent() {
    const chainInvite = await viem.deployContract("ChainInvite");
    const startTime = 1_735_689_600n;

    await chainInvite.write.createEvent([
      "Launch party",
      "Community event",
      startTime,
    ]);

    return { chainInvite, eventId: 1n, startTime };
  }

  it("deploys the contract scaffold", async function () {
    const chainInvite = await viem.deployContract("ChainInvite");

    assert.match(chainInvite.address, /^0x[a-fA-F0-9]{40}$/);
  });

  it("creates an event, increments the counter, and emits EventCreated", async function () {
    const chainInvite = await viem.deployContract("ChainInvite");
    const startTime = 1_735_689_600n;

    await viem.assertions.emitWithArgs(
      chainInvite.write.createEvent([
        "Launch party",
        "Community event",
        startTime,
      ]),
      chainInvite,
      "EventCreated",
      [1n, organizer.account.address, "Launch party", startTime],
    );

    assert.equal(await chainInvite.read.eventCounter(), 1n);

    const eventData = await chainInvite.read.getEvent([1n]);
    assert.equal(eventData.name, "Launch party");
    assert.equal(eventData.description, "Community event");
    assert.equal(eventData.startTime, startTime);
    assert.equal(
      eventData.organizer.toLowerCase(),
      organizer.account.address.toLowerCase(),
    );
    assert.equal(eventData.active, true);
  });

  it("rejects an event without a name", async function () {
    const chainInvite = await viem.deployContract("ChainInvite");

    await viem.assertions.revertWith(
      chainInvite.write.createEvent(["", "Community event", 1n]),
      "name required",
    );
  });

  it("allows the organizer to invite a guest", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainInvite.write.inviteGuest([eventId, guest.account.address]),
      chainInvite,
      "GuestInvited",
      [eventId, guest.account.address],
    );

    assert.equal(
      await chainInvite.read.invited([eventId, guest.account.address]),
      true,
    );
  });

  it("allows the organizer to delete an event", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainInvite.write.deleteEvent([eventId]),
      chainInvite,
      "EventDeleted",
      [eventId, organizer.account.address],
    );

    const eventData = await chainInvite.read.getEvent([eventId]);
    assert.equal(eventData.active, false);
  });

  it("rejects deleting an event from a non-organizer", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.revertWith(
      chainInvite.write.deleteEvent([eventId], {
        account: stranger.account,
      }),
      "not organizer",
    );
  });

  it("rejects invite and check-in actions for deleted events", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await chainInvite.write.inviteGuest([eventId, guest.account.address]);
    await chainInvite.write.deleteEvent([eventId]);

    await viem.assertions.revertWith(
      chainInvite.write.inviteGuest([eventId, secondGuest.account.address]),
      "event inactive",
    );
    await viem.assertions.revertWith(
      chainInvite.write.checkIn([eventId, guest.account.address]),
      "event inactive",
    );
    assert.equal(
      await chainInvite.read.isValidInvite([eventId, guest.account.address]),
      false,
    );
  });

  it("rejects guest invites from a non-organizer", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.revertWith(
      chainInvite.write.inviteGuest([eventId, guest.account.address], {
        account: stranger.account,
      }),
      "not organizer",
    );
  });

  it("invites multiple guests", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await chainInvite.write.inviteMany([
      eventId,
      [guest.account.address, secondGuest.account.address],
    ]);

    assert.equal(
      await chainInvite.read.invited([eventId, guest.account.address]),
      true,
    );
    assert.equal(
      await chainInvite.read.invited([eventId, secondGuest.account.address]),
      true,
    );
  });

  it("updates scanner permissions", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainInvite.write.setScanner([eventId, scanner.account.address, true]),
      chainInvite,
      "ScannerUpdated",
      [eventId, scanner.account.address, true],
    );

    assert.equal(
      await chainInvite.read.scannerAllowed([eventId, scanner.account.address]),
      true,
    );
  });

  it("rejects check-in for a guest who is not invited", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await viem.assertions.revertWith(
      chainInvite.write.checkIn([eventId, guest.account.address]),
      "guest not invited",
    );
  });

  it("checks in an invited guest and emits GuestCheckedIn", async function () {
    const { chainInvite, eventId } = await deployWithEvent();
    await chainInvite.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.emitWithArgs(
      chainInvite.write.checkIn([eventId, guest.account.address]),
      chainInvite,
      "GuestCheckedIn",
      [eventId, guest.account.address, organizer.account.address, anyValue],
    );

    assert.equal(
      await chainInvite.read.checkedIn([eventId, guest.account.address]),
      true,
    );
  });

  it("rejects a second check-in for the same guest", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await chainInvite.write.inviteGuest([eventId, guest.account.address]);
    await chainInvite.write.checkIn([eventId, guest.account.address]);

    await viem.assertions.revertWith(
      chainInvite.write.checkIn([eventId, guest.account.address]),
      "already checked in",
    );
  });

  it("allows an approved scanner to check in a guest", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await chainInvite.write.inviteGuest([eventId, guest.account.address]);
    await chainInvite.write.setScanner([eventId, scanner.account.address, true]);

    await viem.assertions.emitWithArgs(
      chainInvite.write.checkIn([eventId, guest.account.address], {
        account: scanner.account,
      }),
      chainInvite,
      "GuestCheckedIn",
      [eventId, guest.account.address, scanner.account.address, anyValue],
    );
  });

  it("rejects check-in from an unauthorized address", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    await chainInvite.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.revertWith(
      chainInvite.write.checkIn([eventId, guest.account.address], {
        account: stranger.account,
      }),
      "not allowed",
    );
  });

  it("returns valid invite status before and after check-in", async function () {
    const { chainInvite, eventId } = await deployWithEvent();

    assert.equal(
      await chainInvite.read.isValidInvite([eventId, guest.account.address]),
      false,
    );

    await chainInvite.write.inviteGuest([eventId, guest.account.address]);

    assert.equal(
      await chainInvite.read.isValidInvite([eventId, guest.account.address]),
      true,
    );

    await chainInvite.write.checkIn([eventId, guest.account.address]);

    assert.equal(
      await chainInvite.read.isValidInvite([eventId, guest.account.address]),
      false,
    );
  });
});
