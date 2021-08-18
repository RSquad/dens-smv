import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import { createClient, TonContract } from "@rsquad/ton-utils";
import initFaucetChunk from "./chunks/init-faucet.chunk";
import deployTokenRootChunk from "./chunks/deploy-token-root.chunk";
import deployFaucetTokenWalletChunk from "./chunks/deploy-faucet-token-wallet.chunk";
import deployFaucetChunk from "./chunks/deploy-faucet.chunk";
import deployFaucetDebotChunk from "./chunks/deploy-faucet-debot.chunk";
import deployDemiurgeStoreChunk from "./chunks/deploy-demiurge-store.chunk";
import deployDemiurgeChunk from "./chunks/deploy-demiurge.chunk";
import deployDemiurgeDebotChunk from "./chunks/deploy-demiurge-debot.chunk";

describe("Debot test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcDemiurgeDebot: TonContract;

  before(async () => {
    client = createClient();
    smcSafeMultisigWallet = new TonContract({
      client,
      name: "SafeMultisigWallet",
      tonPackage: pkgSafeMultisigWallet,
      address: process.env.MULTISIG_ADDRESS,
      keys: {
        public: process.env.MULTISIG_PUBKEY,
        secret: process.env.MULTISIG_SECRET,
      },
    });
  });

  it("inits Fauset & FaucetDeBot", async () => {
    const result = await initFaucetChunk(client);
    smcFaucet = result.smcFaucet;
    smcFaucetDebot = result.smcFaucetDebot;
  });

  it("deploys TokenRoot", async () => {
    const result = await deployTokenRootChunk(client, smcSafeMultisigWallet);
    smcTokenRoot = result.smcTokenRoot;
  });

  it("deploys FaucetTokenWallet", async () => {
    const result = await deployFaucetTokenWalletChunk(
      client,
      smcTokenRoot,
      smcFaucet
    );
    smcFaucetTokenWallet = result.smcFaucetTokenWallet;
  });

  it("deploys and inits Faucet", async () => {
    await deployFaucetChunk(
      client,
      smcSafeMultisigWallet,
      smcFaucet,
      smcTokenRoot,
      smcFaucetTokenWallet
    );
  });

  it("deploys and inits FaucetDeBot", async () => {
    await deployFaucetDebotChunk(
      client,
      smcSafeMultisigWallet,
      smcFaucetDebot,
      smcFaucet,
      smcTokenRoot,
      smcFaucetTokenWallet
    );
  });

  it("deploys and inits DemiurgeStore", async () => {
    const result = await deployDemiurgeStoreChunk(
      client,
      smcSafeMultisigWallet,
      smcFaucet,
      smcTokenRoot
    );
    smcDemiurgeStore = result.smcDemiurgeStore;
  });

  it("deploys and inits Demiurge", async () => {
    const result = await deployDemiurgeChunk(
      client,
      smcSafeMultisigWallet,
      smcDemiurgeStore
    );
    smcDemiurge = result.smcDemiurge;
  });

  it("deploys and inits DemiurgeDebot", async () => {
    await deployDemiurgeDebotChunk(
      client,
      smcSafeMultisigWallet,
      smcDemiurgeDebot,
      smcDemiurge,
      smcDemiurgeStore,
      smcFaucetDebot
    );
  });
});
