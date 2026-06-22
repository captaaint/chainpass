import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { anyValue } from "@nomicfoundation/hardhat-viem-assertions/predicates";
import { network } from "hardhat";

describe("ChainInviteNFT", async function () {
  const { viem } = await network.create();
  const [organizer, guest, scanner, stranger, secondGuest] =
    await viem.getWalletClients();

  async function deployWithEvent() {
    const chainInviteNft = await viem.deployContract("ChainInviteNFT");
    const startTime = 1_735_689_600n;
    const endTime = 4_102_444_800n; // 2100, far enough in the future for tests

    await chainInviteNft.write.createEvent([
      "Launch party",
      "Community event",
      startTime,
      endTime,
    ]);

    return { chainInviteNft, eventId: 1n, startTime, endTime };
  }

  it("deploys with the expected ERC-721 name and symbol", async function () {
    const chainInviteNft = await viem.deployContract("ChainInviteNFT");

    assert.equal(await chainInviteNft.read.name(), "ChainInvite Ticket");
    assert.equal(await chainInviteNft.read.symbol(), "CINV");
    assert.equal(await chainInviteNft.read.nextTokenId(), 1n);
  });

  it("mints an NFT invite to the guest", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainInviteNft.write.inviteGuest([eventId, guest.account.address]),
      chainInviteNft,
      "InviteMinted",
      [eventId, guest.account.address, 1n],
    );

    assert.equal(
      (await chainInviteNft.read.ownerOf([1n])).toLowerCase(),
      guest.account.address.toLowerCase(),
    );
    assert.equal(await chainInviteNft.read.guestToken([eventId, guest.account.address]), 1n);
    assert.equal(await chainInviteNft.read.invited([eventId, guest.account.address]), true);
  });

  it("allows the organizer to delete an NFT event", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await viem.assertions.emitWithArgs(
      chainInviteNft.write.deleteEvent([eventId]),
      chainInviteNft,
      "EventDeleted",
      [eventId, organizer.account.address],
    );

    const eventData = await chainInviteNft.read.getEvent([eventId]);
    assert.equal(eventData.active, false);
  });

  it("rejects deleting an NFT event from a non-organizer", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await viem.assertions.revertWith(
      chainInviteNft.write.deleteEvent([eventId], {
        account: stranger.account,
      }),
      "not organizer",
    );
  });

  it("rejects NFT invite and check-in actions for deleted events", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);
    await chainInviteNft.write.deleteEvent([eventId]);

    await viem.assertions.revertWith(
      chainInviteNft.write.inviteGuest([eventId, secondGuest.account.address]),
      "event inactive",
    );
    await viem.assertions.revertWith(
      chainInviteNft.write.checkIn([eventId, guest.account.address, 1n]),
      "event inactive",
    );
    assert.equal(
      await chainInviteNft.read.isValidInvite([eventId, guest.account.address]),
      false,
    );
  });

  it("stores which event a token belongs to", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    assert.equal(await chainInviteNft.read.tokenEvent([1n]), eventId);
  });

  it("rejects duplicate NFT invites for the same event and guest", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.revertWith(
      chainInviteNft.write.inviteGuest([eventId, guest.account.address]),
      "guest already invited",
    );
  });

  it("invites multiple guests with distinct tokens", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteMany([
      eventId,
      [guest.account.address, secondGuest.account.address],
    ]);

    assert.equal(
      (await chainInviteNft.read.ownerOf([1n])).toLowerCase(),
      guest.account.address.toLowerCase(),
    );
    assert.equal(
      (await chainInviteNft.read.ownerOf([2n])).toLowerCase(),
      secondGuest.account.address.toLowerCase(),
    );
    assert.equal(await chainInviteNft.read.nextTokenId(), 3n);
  });

  it("checks in a token owner and marks the token as used", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.emitWithArgs(
      chainInviteNft.write.checkIn([eventId, guest.account.address, 1n]),
      chainInviteNft,
      "GuestCheckedIn",
      [eventId, guest.account.address, organizer.account.address, 1n, anyValue],
    );

    assert.equal(await chainInviteNft.read.tokenUsed([1n]), true);
    assert.equal(await chainInviteNft.read.checkedIn([eventId, guest.account.address]), true);
  });

  it("rejects check-in if the guest does not own the token", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.revertWith(
      chainInviteNft.write.checkIn([eventId, stranger.account.address, 1n]),
      "guest does not own token",
    );
  });

  it("rejects a second check-in for an already used token", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);
    await chainInviteNft.write.checkIn([eventId, guest.account.address, 1n]);

    await viem.assertions.revertWith(
      chainInviteNft.write.checkIn([eventId, guest.account.address, 1n]),
      "token already used",
    );
  });

  it("allows an approved scanner to check in the NFT invite", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);
    await chainInviteNft.write.setScanner([eventId, scanner.account.address, true]);

    await viem.assertions.emitWithArgs(
      chainInviteNft.write.checkIn([eventId, guest.account.address, 1n], {
        account: scanner.account,
      }),
      chainInviteNft,
      "GuestCheckedIn",
      [eventId, guest.account.address, scanner.account.address, 1n, anyValue],
    );
  });

  it("returns valid invite status based on ownership and token usage", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    assert.equal(
      await chainInviteNft.read.isValidInvite([eventId, guest.account.address]),
      false,
    );

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    assert.equal(
      await chainInviteNft.read.isValidInvite([eventId, guest.account.address]),
      true,
    );
    assert.equal(
      await chainInviteNft.read.isValidToken([eventId, guest.account.address, 1n]),
      true,
    );

    await chainInviteNft.write.checkIn([eventId, guest.account.address, 1n]);

    assert.equal(
      await chainInviteNft.read.isValidInvite([eventId, guest.account.address]),
      false,
    );
  });

  it("blocks transfers because the ticket is soulbound", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    await viem.assertions.revertWith(
      chainInviteNft.write.transferFrom(
        [guest.account.address, secondGuest.account.address, 1n],
        { account: guest.account },
      ),
      "token is soulbound",
    );

    // Ownership stays unchanged.
    assert.equal(
      (await chainInviteNft.read.ownerOf([1n])).toLowerCase(),
      guest.account.address.toLowerCase(),
    );
  });

  it("allows check-in when the event has no expiration (endTime = 0)", async function () {
    const chainInviteNft = await viem.deployContract("ChainInviteNFT");
    await chainInviteNft.write.createEvent(["No expiry", "desc", 0n, 0n]);
    await chainInviteNft.write.inviteGuest([1n, guest.account.address]);

    await chainInviteNft.write.checkIn([1n, guest.account.address, 1n]);

    assert.equal(await chainInviteNft.read.tokenUsed([1n]), true);
  });

  it("rejects check-in after the validity window and reports the invite invalid", async function () {
    const chainInviteNft = await viem.deployContract("ChainInviteNFT");
    // endTime = 1 (1970), expired for any realistic chain timestamp.
    await chainInviteNft.write.createEvent(["Expired", "desc", 0n, 1n]);
    await chainInviteNft.write.inviteGuest([1n, guest.account.address]);

    assert.equal(
      await chainInviteNft.read.isValidInvite([1n, guest.account.address]),
      false,
    );

    await viem.assertions.revertWith(
      chainInviteNft.write.checkIn([1n, guest.account.address, 1n]),
      "invite expired",
    );
  });

  it("rejects creating an event with endTime before startTime", async function () {
    const chainInviteNft = await viem.deployContract("ChainInviteNFT");

    await viem.assertions.revertWith(
      chainInviteNft.write.createEvent(["Bad window", "desc", 1_000n, 999n]),
      "endTime before startTime",
    );
  });

  it("returns data URI metadata for minted invite tokens", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    const tokenUri = await chainInviteNft.read.tokenURI([1n]);
    const encodedJson = tokenUri.replace("data:application/json;base64,", "");
    const metadata = JSON.parse(Buffer.from(encodedJson, "base64").toString("utf8"));

    assert.equal(tokenUri.startsWith("data:application/json;base64,"), true);
    assert.equal(metadata.name, "ChainInvite Ticket #1");
    assert.equal(metadata.image.startsWith("data:image/svg+xml;base64,"), true);
  });
});
