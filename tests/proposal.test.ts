import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgProposal from "../ton-packages/Proposal.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import { createClient, logPubGetter, TonContract } from "@rsquad/ton-utils";
import initFaucetChunk from "./chunks/init-faucet.chunk";
import deployTokenRootChunk from "./chunks/deploy-token-root.chunk";
import deployFaucetTokenWalletChunk from "./chunks/deploy-faucet-token-wallet.chunk";
import deployFaucetChunk from "./chunks/deploy-faucet.chunk";
import deploySmvRootStoreChunk from "./chunks/deploy-smv-root-store.chunk";
import deploySmvRootChunk from "./chunks/deploy-smv-root.chunk";
import * as fs from "fs";
import { isAddrActive } from "./utils";
import { expect } from "chai";
import { callThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import deployUserTokenWalletChunk from "./chunks/faucet/deploy-user-token-wallet.chunk";
import { EMPTY_ADDRESS } from "@rsquad/ton-utils/dist/constants";

describe("Proposal test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcSmvRootStore: TonContract;
  let smcSmvRoot: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcReserveProposal: TonContract;
  let smcFaucet: TonContract;
  let smcPadawan: TonContract;
  let smcUserTokenWallet: TonContract;

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

  it("deploys ReserveProposal", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcSmvRoot.tonPackage.abi,
      functionName: "deployReserveProposal",
      input: {
        title: utf8ToHex("title-random"),
        specific: {
          name: utf8ToHex("title-random"),
          ts: 100000,
        },
      },
      dest: smcSmvRoot.address,
      value: 10_000_000_000,
    });

    const addrReserveProposal = (
      await smcSmvRoot.run({
        functionName: "resolveProposal",
        input: {
          addrRoot: smcSmvRoot.address,
          id: 0,
        },
      })
    ).value.addrProposal;

    const isReserveProposalActive = await isAddrActive(
      client,
      addrReserveProposal
    );
    expect(isReserveProposalActive, "ReserveProposal not active").to.be.true;

    console.log(`ReserveProposal deployed: ${addrReserveProposal}`);

    smcReserveProposal = new TonContract({
      client,
      name: "ReserveProposal",
      tonPackage: pkgProposal,
      address: addrReserveProposal,
    });
  });

  it("checks ReserveProposal OnVoting state", async () => {
    const state = (
      await smcReserveProposal.run({ functionName: "_proposalInfo" })
    ).value._proposalInfo.state;
    expect(state).to.be.eq("2");
  });

  it("deploys Padawan", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcSmvRoot.tonPackage.abi,
      functionName: "deployPadawan",
      input: {
        owner: smcSafeMultisigWallet.address,
      },
      dest: smcSmvRoot.address,
      value: 10_000_000_000,
    });

    const addrPadawan = (
      await smcSmvRoot.run({
        functionName: "resolvePadawan",
        input: {
          owner: smcSafeMultisigWallet.address,
        },
      })
    ).value.addrPadawan;

    const isPadawanActive = await isAddrActive(client, addrPadawan);
    expect(isPadawanActive, "Padawan not active").to.be.true;

    console.log(`Padawan deployed: ${addrPadawan}`);

    smcPadawan = new TonContract({
      client,
      name: "Padawan",
      tonPackage: pkgPadawan,
      address: addrPadawan,
    });
  });

  it("deploys UserTokenWallet throught Faucet", async () => {
    const result = await deployUserTokenWalletChunk(
      client,
      smcTokenRoot,
      smcFaucet
    );
    smcUserTokenWallet = result.smcUserTokenWallet;
  });

  it("claims tokens from Faucet to UserTokenWallet", async () => {
    const raw = fs.readFileSync("./k1");
    await smcFaucet.call({
      functionName: "claimTokens",
      input: {
        addrTokenWallet: smcUserTokenWallet.address,
      },
      keys: JSON.parse(raw as any),
    });

    const balance = (
      await smcUserTokenWallet.run({ functionName: "getBalance" })
    ).value.value0;

    expect(balance).to.be.eq("1000");
  });

  it("sends tokens from UserTokenWallet to Padawan", async () => {
    const raw = fs.readFileSync("./k1");

    const addrPadawanTokenWallet = (
      await smcPadawan.run({ functionName: "_tipAccount" })
    ).value._tipAccount.addr;

    await smcUserTokenWallet.call({
      functionName: "transfer",
      input: {
        answer_addr: EMPTY_ADDRESS,
        to: addrPadawanTokenWallet,
        tokens: 1000,
        grams: 200_000_000,
        return_ownership: true,
      },
      keys: JSON.parse(raw as any),
    });

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: pkgPadawan.abi,
      functionName: "depositTokens",
      input: {},
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    const balancePadawan = (
      await smcPadawan.run({ functionName: "_tipAccount" })
    ).value._tipAccount.balance;

    expect(balancePadawan).to.be.eq("1000");
  });

  it("votes for with 1000 votes", async () => {
    const raw = fs.readFileSync("./k1");

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: pkgPadawan.abi,
      functionName: "vote",
      input: {
        proposal: smcReserveProposal.address,
        choice: true,
        votes: 1000,
      },
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });
  });

  it("checks ReserveProposal End state", async () => {
    const proposalInfo = (
      await smcReserveProposal.run({ functionName: "_proposalInfo" })
    ).value._proposalInfo;
    expect(proposalInfo.state).to.be.eq("4");
  });
});
