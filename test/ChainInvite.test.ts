import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("ChainInvite", async function () {
  const { viem } = await network.create();

  it("deploys the empty contract scaffold", async function () {
    const chainInvite = await viem.deployContract("ChainInvite");

    assert.match(chainInvite.address, /^0x[a-fA-F0-9]{40}$/);
  });
});
