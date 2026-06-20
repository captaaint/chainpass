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

    await chainInviteNft.write.createEvent([
      "Launch party",
      "Community event",
      startTime,
    ]);

    return { chainInviteNft, eventId: 1n, startTime };
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

  it("returns data URI metadata for minted invite tokens", async function () {
    const { chainInviteNft, eventId } = await deployWithEvent();

    await chainInviteNft.write.inviteGuest([eventId, guest.account.address]);

    const tokenUri = await chainInviteNft.read.tokenURI([1n]);

    assert.equal(tokenUri.startsWith("data:application/json;base64,"), true);
  });
});
