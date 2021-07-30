import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgTestRoot from "../ton-packages/TestRoot.package";
import deployDemiurgeStore from "./parts/deploy-demiurge-store";
import deployDemiurge from "./parts/deploy-demiurge";
import deployToken from "./parts/deploy-token";
import deployDebot from "./parts/deploy-debot";
import deployFaucet from "./parts/deploy-faucet";
import deployFaucetDebot from "./parts/deploy-faucet-debot";
import pkgFaucet from "../ton-packages/Faucet.package";
import pkgFaucetDebot from "../ton-packages/FaucetDebot.package";
import { createClient, logPubGetter, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
const fs = require("fs");

describe("Debot test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcTestRoot: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcDebot: TonContract;

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

    smcFaucet = new TonContract({
      client,
      name: "Faucet",
      tonPackage: pkgFaucet,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcFaucet.calcAddress();

    smcFaucetDebot = new TonContract({
      client,
      name: "FaucetDebot",
      tonPackage: pkgFaucetDebot,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    smcFaucetDebot.calcAddress();
  });

  it("deploy and init Token", async () => {
    [smcTokenRoot, smcFaucetTokenWallet] = await deployToken(
      client,
      smcSafeMultisigWallet,
      smcFaucet.address
    );
  });

  it("deploy faucet", async () => {
    smcFaucet = await deployFaucet(
      smcSafeMultisigWallet,
      smcFaucet,
      smcTokenRoot.address,
      smcFaucetTokenWallet.address
    );
  });

  it("set initial faucet balance", async () => {
    const keys = await client.crypto.generate_random_sign_keys();
    await smcFaucet.call({
      functionName: "changeBalance",
      input: {
        pubkey: `0x${keys.public}`,
        value: 1000,
      },
    });
    logPubGetter("Balances updated", smcFaucet, "_balances");
    fs.writeFileSync("./k1", JSON.stringify(keys));
  });

  it("deploy faucetDebot", async () => {
    smcFaucet = await deployFaucetDebot(
      smcSafeMultisigWallet,
      smcFaucetDebot,
      smcFaucet.address,
      smcTokenRoot.address,
      smcFaucetTokenWallet.address
    );
  });

  it("deploy TestRoot", async () => {
    smcTestRoot = new TonContract({
      client,
      name: "TestRoot",
      tonPackage: pkgTestRoot,
      keys: await client.crypto.generate_random_sign_keys(),
    });

    await smcTestRoot.calcAddress();

    await sendThroughMultisig({
      smcSafeMultisigWallet,
      dest: smcTestRoot.address,
      value: 100_000_000_000,
    });

    console.log(`TestRoot address: ${smcTestRoot.address}`);

    await smcTestRoot.deploy();
  });

  it("deploy and init DemiurgeStore", async () => {
    smcDemiurgeStore = await deployDemiurgeStore(
      client,
      smcSafeMultisigWallet,
      smcTestRoot.address,
      smcTokenRoot.address
    );
  });

  it("deploy and init Demiurge", async () => {
    smcDemiurge = await deployDemiurge(
      client,
      smcSafeMultisigWallet,
      smcDemiurgeStore
    );
  });

  it("deploy DeBot", async () => {
    smcDebot = await deployDebot(
      client,
      smcSafeMultisigWallet,
      smcDemiurge,
      smcDemiurgeStore,
      smcFaucetDebot.address
    );
  });
});
