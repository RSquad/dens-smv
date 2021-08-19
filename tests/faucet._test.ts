import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import { createClient, TonContract } from "@rsquad/ton-utils";
import initFaucetChunk from "./chunks/init-faucet.chunk";
import deployTokenRootChunk from "./chunks/deploy-token-root.chunk";
import deployFaucetTokenWalletChunk from "./chunks/deploy-faucet-token-wallet.chunk";
import deployFaucetChunk from "./chunks/deploy-faucet.chunk";
import deployFaucetDebotChunk from "./chunks/deploy-faucet-debot.chunk";
import deploySmvRootStoreChunk from "./chunks/deploy-smv-root-store.chunk";
import deploySmvRootChunk from "./chunks/deploy-smv-root.chunk";
import deploySmvDebotChunk from "./chunks/deploy-smv-debot.chunk";
import * as fs from "fs";
import { EMPTY_ADDRESS } from "@rsquad/ton-utils/dist/constants";
import { isAddrActive } from "./utils";
import { expect } from "chai";
import { callThroughMultisig } from "@rsquad/ton-utils/dist/net";

describe("Faucet test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcSmvRootStore: TonContract;
  let smcSmvRoot: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcSmvDebot: TonContract;

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

  it("inits Fauset and FaucetDeBot", async () => {
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

  it("deploys and inits SmvRootStore", async () => {
    const result = await deploySmvRootStoreChunk(
      client,
      smcSafeMultisigWallet,
      smcFaucet,
      smcTokenRoot
    );
    smcSmvRootStore = result.smcSmvRootStore;
  });

  it("deploys and inits SmvRoot", async () => {
    const result = await deploySmvRootChunk(
      client,
      smcSafeMultisigWallet,
      smcSmvRootStore
    );
    smcSmvRoot = result.smcSmvRoot;
  });

  // it("deploys UserTokenWallet throught Faucet", async () => {
  //   const raw = fs.readFileSync("./k1");
  //   await smcFaucet.call({
  //     functionName: "deployWallet",
  //     keys: JSON.parse(raw as any),
  //   });

  //   const addrUserTokenWallet = (
  //     await smcTokenRoot.run({
  //       functionName: "getWalletAddress",
  //       input: {
  //         pubkey: `0x${JSON.parse(raw as any).public}`,
  //         owner: EMPTY_ADDRESS,
  //       },
  //     })
  //   ).value.value0;

  //   const isUserTokenWalletActive = await isAddrActive(
  //     client,
  //     addrUserTokenWallet
  //   );
  //   expect(isUserTokenWalletActive, "UserTokenWallet not active").to.be.true;

  //   console.log(`UserTokenWallet deployed: ${addrUserTokenWallet}`);
  // });

  it("deploys UserTokenWallet throught Multisig", async () => {
    const raw = fs.readFileSync("./k1");
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcTokenRoot.tonPackage.abi,
      functionName: "deployEmptyWallet",
      input: {
        _answer_id: 0,
        pubkey: `0x${JSON.parse(raw as any).public}`,
        internal_owner: EMPTY_ADDRESS,
        grams: 3_000_000_000,
      },
      dest: smcTokenRoot.address,
      value: 10_000_000_000,
    });

    const addrUserTokenWallet = (
      await smcTokenRoot.run({
        functionName: "getWalletAddress",
        input: {
          pubkey: `0x${JSON.parse(raw as any).public}`,
          owner: EMPTY_ADDRESS,
        },
      })
    ).value.value0;

    const isUserTokenWalletActive = await isAddrActive(
      client,
      addrUserTokenWallet
    );
    expect(isUserTokenWalletActive, "UserTokenWallet not active").to.be.true;

    console.log(`UserTokenWallet deployed: ${addrUserTokenWallet}`);
  });
});
