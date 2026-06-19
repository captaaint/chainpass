import { network } from "hardhat";

const { viem } = await network.create();
const chainInvite = await viem.deployContract("ChainInvite");

console.log("ChainInvite deployed to:", chainInvite.address);
