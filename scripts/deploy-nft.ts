import { network } from "hardhat";

const privateKey = process.env.PRIVATE_KEY ?? "";

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Invalid PRIVATE_KEY in .env. Expected a MetaMask test wallet private key in 0x + 64 hex character format.",
  );
}

const { viem } = await network.create();
const chainInviteNft = await viem.deployContract("ChainInviteNFT");

console.log("ChainInviteNFT deployed to:", chainInviteNft.address);
