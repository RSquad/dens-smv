import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgProposal from "../ton-packages/Proposal.package";
import { createClient, TonContract } from "@rsquad/ton-utils";
import initChunk from "./init.chunk";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import {
  callThroughMultisig,
  waitForMessage,
} from "@rsquad/ton-utils/dist/net";

describe("Proposal test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcDemiurgeDebot: TonContract;
  let smcReserveProposal: TonContract;

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
    const contracts = await initChunk(client, smcSafeMultisigWallet);
    smcDemiurgeStore = contracts.smcDemiurgeStore;
    smcDemiurge = contracts.smcDemiurge;
    smcTokenRoot = contracts.smcTokenRoot;
    smcFaucetTokenWallet = contracts.smcFaucetTokenWallet;
    smcFaucetDebot = contracts.smcFaucetDebot;
    smcFaucet = contracts.smcFaucet;
    smcDemiurgeDebot = contracts.smcDemiurgeDebot;
  });

  it("deploy ReserveProposal", async () => {
    const title = utf8ToHex("test proposal");

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployReserveProposal",
      input: {
        title,
        specific: {
          name: utf8ToHex("nic-name"),
          ts: 100000,
        },
      },
      dest: smcDemiurge.address,
      value: 8_000_000_000,
    });

    const addrProposal = (
      await smcDemiurge.run({
        functionName: "resolveProposal",
        input: {
          title,
        },
      })
    ).value.addrProposal;

    await waitForMessage(
      client,
      { src: { eq: smcDemiurge.address }, dst: { eq: addrProposal } },
      "id"
    );

    smcReserveProposal = new TonContract({
      client,
      name: "ReserveProposal",
      tonPackage: pkgProposal,
      address: addrProposal,
    });

    console.log(`ReserveProposal deployed: ${smcReserveProposal.address}`);
  });
});
