import "dotenv/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL ?? "";
const privateKey = process.env.PRIVATE_KEY ?? "";
const sepoliaAccounts = /^0x[0-9a-fA-F]{64}$/.test(privateKey) ? [privateKey] : [];
const networks: Record<string, any> = {
  hardhatMainnet: {
    type: "edr-simulated",
    chainType: "l1",
  },
};

if (sepoliaRpcUrl !== "") {
  networks.sepolia = {
    type: "http",
    chainType: "l1",
    url: sepoliaRpcUrl,
    accounts: sepoliaAccounts,
  };
}

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks,
});
