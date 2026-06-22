import { network } from "hardhat";

const privateKey = process.env.PRIVATE_KEY ?? "";

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Invalid PRIVATE_KEY in .env. Use a MetaMask test wallet private key in 0x + 64 hex format, not a wallet address.",
  );
}

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const { contract: chainInvite, deploymentTransaction } =
  await viem.sendDeploymentTransaction("ChainInvite");
const receipt = await publicClient.waitForTransactionReceipt({
  hash: deploymentTransaction.hash,
});

console.log("ChainInvite contract address:", chainInvite.address);
console.log("Deployment transaction:", deploymentTransaction.hash);
console.log("Deployment block:", receipt.blockNumber.toString());
console.log("");
console.log("Copy these values into web/.env.local:");
console.log(`NEXT_PUBLIC_CHAININVITE_ADDRESS=${chainInvite.address}`);
console.log("NEXT_PUBLIC_CHAIN_ID=11155111");
console.log(`NEXT_PUBLIC_CHAININVITE_DEPLOYMENT_BLOCK=${receipt.blockNumber.toString()}`);
