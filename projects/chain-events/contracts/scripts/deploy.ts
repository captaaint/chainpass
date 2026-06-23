import { network } from "hardhat";

const privateKey = process.env.PRIVATE_KEY ?? "";

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Invalid PRIVATE_KEY in .env. Use a MetaMask test wallet private key in 0x + 64 hex format, not a wallet address.",
  );
}

const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const { contract: chainEvents, deploymentTransaction } =
  await viem.sendDeploymentTransaction("ChainEvents");
const receipt = await publicClient.waitForTransactionReceipt({
  hash: deploymentTransaction.hash,
});

console.log("ChainEvents contract address:", chainEvents.address);
console.log("Deployment transaction:", deploymentTransaction.hash);
console.log("Deployment block:", receipt.blockNumber.toString());
