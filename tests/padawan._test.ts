import { KeyPair, TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import pkgTTW from "../ton-packages/TTW.package";
import { createClient, logPubGetter, TonContract } from "@rsquad/ton-utils";
import initChunk from "./init.chunk";
import {
  callThroughMultisig,
  waitForMessage,
} from "@rsquad/ton-utils/dist/net";
import { expect } from "chai";

describe("Padawan test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcDemiurgeDebot: TonContract;
  let smcPadawan: TonContract;
  let smcUserTokenWallet: TonContract;
  let keysTestUser: KeyPair;

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

  it("init system", async () => {
    const { contracts, keys } = await initChunk(client, smcSafeMultisigWallet);
    smcDemiurgeStore = contracts.smcDemiurgeStore;
    smcDemiurge = contracts.smcDemiurge;
    smcTokenRoot = contracts.smcTokenRoot;
    smcFaucetTokenWallet = contracts.smcFaucetTokenWallet;
    smcFaucetDebot = contracts.smcFaucetDebot;
    smcFaucet = contracts.smcFaucet;
    smcDemiurgeDebot = contracts.smcDemiurgeDebot;
    keysTestUser = keys.keysTestUser;
  });

  it("deploy Padawan", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployPadawan",
      input: {
        owner: smcSafeMultisigWallet.address,
      },
      dest: smcDemiurge.address,
      value: 6_000_000_000,
    });

    const addrPadawan = (
      await smcDemiurge.run({
        functionName: "resolvePadawan",
        input: {
          owner: smcSafeMultisigWallet.address,
        },
      })
    ).value.addrPadawan;

    await waitForMessage(
      client,
      { src: { eq: smcDemiurge.address }, dst: { eq: addrPadawan } },
      "id"
    );

    smcPadawan = new TonContract({
      client,
      name: "Padawan",
      tonPackage: pkgPadawan,
      address: addrPadawan,
    });
  });

  it("create wallet for user", async () => {
    await smcFaucet.call({
      functionName: "deployWallet",
      keys: keysTestUser,
    });

    const addrUserTokenWallet = (
      await smcTokenRoot.run({
        functionName: "getWalletAddress",
        input: {
          workchain_id: 0,
          pubkey: `0x${keysTestUser.public}`,
          owner_std_addr: 0,
        },
      })
    ).value.value0;

    const result = (
      await client.net.query_collection({
        collection: "accounts",
        filter: { id: { eq: addrUserTokenWallet } },
        result: "acc_type",
      })
    ).result;

    expect(result).to.be.lengthOf(1);
    expect(result[0].acc_type).to.be.eq(1);

    smcUserTokenWallet = new TonContract({
      client,
      name: "UserTokenWallet",
      tonPackage: pkgTTW,
      keys: keysTestUser,
      address: addrUserTokenWallet,
    });

    console.log(`UserTokenWallet deployed: ${addrUserTokenWallet}`);
  });

  it("claim tokens from Faucet", async () => {
    await logPubGetter(
      "Fauset totalDistributed before claim",
      smcFaucet,
      "_totalDistributed"
    );

    expect(
      (await smcFaucet.run({ functionName: "_totalDistributed" })).value
        ._totalDistributed
    ).to.be.eq("0");

    await smcFaucet.call({
      functionName: "claimTokens",
      input: { addrTokenWallet: smcUserTokenWallet.address },
      keys: smcUserTokenWallet.keys,
    });

    await logPubGetter(
      "Fauset totalDistributed after claim",
      smcFaucet,
      "_totalDistributed"
    );

    expect(
      (
        await smcFaucet.run({
          functionName: "_totalDistributed",
        })
      ).value._totalDistributed
    ).to.be.eq("1000");

    const balanceUserTokenWallet = (
      await smcUserTokenWallet.run({
        functionName: "getBalance",
      })
    ).value.value0;

    console.log(`UserTokenWallet balance: ${balanceUserTokenWallet}`);

    expect(balanceUserTokenWallet).to.be.eq("1000");
  });
});
