import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import pkgProposal from "../ton-packages/Proposal.package";
import pkgTestRoot from "../ton-packages/TestRoot.package";
import pkgTTW from "../ton-packages/TTW.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import deployDemiurgeStore from "./parts/deploy-demiurge-store";
import deployDemiurge from "./parts/deploy-demiurge";
import { expect } from "chai";
import deployToken from "./parts/deploy-token";
import { createClient, sleep, TonContract } from "@rsquad/ton-utils";
import {
  callThroughMultisig,
  sendThroughMultisig,
} from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";

describe("Main test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcProposal: TonContract;
  let smcProposal2: TonContract;
  let smcPadawan: TonContract;
  let smcTestRoot: TonContract;
  let smcTokenRoot: TonContract;
  let smcTTWUser: TonContract;
  let smcTTWPadawan: TonContract;

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

    console.log(`TestRoot address: ${smcTestRoot.address}
      TestRoot public: ${smcTestRoot.keys.public}
      TestRoot secret: ${smcTestRoot.keys.secret}
      TestRoot balance: ${await smcTestRoot.getBalance()}`);

    await smcTestRoot.deploy();
  });

  it("deploy and init Token", async () => {
    [smcTokenRoot, smcTTWUser] = await deployToken(
      client,
      smcSafeMultisigWallet
    );
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

  it("tests that deployReserveProposal doesn't support external calls", async () => {
    let externalCallError;
    try {
      await smcDemiurge.call({
        functionName: "deployReserveProposal",
        input: {
          start: Math.round(Date.now() / 1000) + 180,
          end: Math.round(Date.now() / 1000) + 180 + 60 + 60 * 60 * 24 * 7,
          title: utf8ToHex("title"),
          specific: {
            name: utf8ToHex("name"),
            ts: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 365,
          },
        },
      });
    } catch (err) {
      externalCallError = err;
    }
    expect(externalCallError).to.be.not.empty;
  });

  it("tests deployReserveProposal2 throught Multisig", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployReserveProposal",
      input: {
        title: utf8ToHex("title2"),
        specific: {
          name: utf8ToHex("name"),
          ts: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 365,
        },
      },
      dest: smcDemiurge.address,
      value: 6_000_000_000,
    });
  });

  it("tests deployReserveProposal throught Multisig", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployReserveProposal",
      input: {
        title: utf8ToHex("title"),
        specific: {
          name: utf8ToHex("name"),
          ts: Math.round(Date.now() / 1000) + 60 * 60 * 24 * 365,
        },
      },
      dest: smcDemiurge.address,
      value: 6_000_000_000,
    });
  });

  it("tests that ReserveProposal has been deployed", async () => {
    const { addrProposal } = (
      await smcDemiurge.run({
        functionName: "resolveProposal",
        input: {
          title: utf8ToHex("title"),
        },
      })
    ).value;

    const check = (
      await client.net.query_collection({
        collection: "accounts",
        filter: {
          id: { eq: addrProposal },
          acc_type: { eq: 1 },
        },
        result: "id acc_type",
      })
    ).result;

    expect(check).to.be.length(1);
    expect(check[0].acc_type).to.be.eq(1);

    smcProposal = new TonContract({
      client,
      name: "Proposal",
      tonPackage: pkgProposal,
      address: addrProposal,
    });
  });

  it("tests that ReserveProposal2 has been deployed", async () => {
    const { addrProposal } = (
      await smcDemiurge.run({
        functionName: "resolveProposal",
        input: {
          title: utf8ToHex("title2"),
        },
      })
    ).value;

    const check = (
      await client.net.query_collection({
        collection: "accounts",
        filter: {
          id: { eq: addrProposal },
          acc_type: { eq: 1 },
        },
        result: "id acc_type",
      })
    ).result;

    expect(check).to.be.length(1);
    expect(check[0].acc_type).to.be.eq(1);

    smcProposal2 = new TonContract({
      client,
      name: "Proposal2",
      tonPackage: pkgProposal,
      address: addrProposal,
    });
  });

  it("tests that deployPadawan doesn't support external calls", async () => {
    let externalCallError;
    try {
      await smcDemiurge.call({
        functionName: "deployPadawan",
        input: {
          owner: smcSafeMultisigWallet.address,
        },
      });
    } catch (err) {
      externalCallError = err;
    }
    expect(externalCallError).to.be.not.empty;
  });

  it("tests deployPadawan throught Multisig", async () => {
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcDemiurge.tonPackage.abi,
      functionName: "deployPadawan",
      input: {
        owner: smcSafeMultisigWallet.address,
      },
      dest: smcDemiurge.address,
      value: 5_000_000_000,
    });
  });

  it("tests that Padawan has been deployed", async () => {
    const { addrPadawan } = (
      await smcDemiurge.run({
        functionName: "resolvePadawan",
        input: {
          owner: smcSafeMultisigWallet.address,
        },
      })
    ).value;

    expect(
      (
        await client.net.query_collection({
          collection: "accounts",
          filter: {
            id: { eq: addrPadawan },
            acc_type: { eq: 1 },
          },
          result: "id",
        })
      ).result
    ).to.be.length(1);

    smcPadawan = new TonContract({
      client,
      name: "Padawan",
      tonPackage: pkgPadawan,
      address: addrPadawan,
    });

    console.log(`Padawan address: ${smcPadawan.address}
      Padawan balance: ${await smcPadawan.getBalance()}`);

    const TTWAddr = (
      await smcPadawan.run({
        functionName: "getAll",
      })
    ).value.tipAccount.addr;

    smcTTWPadawan = new TonContract({
      client,
      name: "TTW",
      tonPackage: pkgTTW,
      address: TTWAddr,
    });
  });

  it("deposit tokens to account", async () => {
    const TOKEN_DEPOSIT = 16000000;

    await smcTTWUser.call({
      functionName: "transfer",
      input: {
        dest: smcTTWPadawan.address,
        tokens: TOKEN_DEPOSIT,
        grams: 1_000_000_000,
      },
    });

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "depositTokens",
      input: {},
      dest: smcPadawan.address,
      value: 2_000_000_000,
    });

    console.log(
      (await smcPadawan.run({ functionName: "getAll" })).value.allDeposits
    );

    console.log((await smcPadawan.run({ functionName: "getVoteInfo" })).value);
  });

  it("send votes for proposal", async () => {
    const VOTES_COUNT = 1000001;

    console.log(
      `Padawan vote info before: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes before: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );

    console.log(smcProposal.address);

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "vote",
      input: {
        proposal: smcProposal.address,
        choice: false,
        votes: VOTES_COUNT,
      },
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    console.log(
      `Padawan vote info after: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes after: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );
  });

  it("send votes for proposal2", async () => {
    const VOTES_COUNT = 13333;

    console.log(
      `Padawan vote info before: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes before: `,
      (await smcProposal2.run({ functionName: "getCurrentVotes" })).value
    );

    console.log(smcProposal2.address);

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "vote",
      input: {
        proposal: smcProposal2.address,
        choice: false,
        votes: VOTES_COUNT,
      },
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    console.log(
      `Padawan vote info after: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes after: `,
      (await smcProposal2.run({ functionName: "getCurrentVotes" })).value
    );
  });
  it("send votes for proposal", async () => {
    const VOTES_COUNT = 14000001;

    console.log(
      `Padawan vote info before: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes before: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );

    console.log(smcProposal.address);

    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "vote",
      input: {
        proposal: smcProposal.address,
        choice: false,
        votes: VOTES_COUNT,
      },
      dest: smcPadawan.address,
      value: 5_000_000_000,
    });

    console.log(
      `Padawan vote info after: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log(
      `Proposal current votes after: `,
      (await smcProposal.run({ functionName: "getCurrentVotes" })).value
    );
  });

  it("checks proposal result", async () => {
    console.log(
      (await smcProposal.run({ functionName: "getVotingResults" })).value
    );
    console.log(
      (await smcTestRoot.run({ functionName: "_proposalInfo" })).value
    );
    console.log((await smcTestRoot.run({ functionName: "_specific" })).value);

    console.log(
      `Padawan vote info: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
  });

  it("reclaim", async () => {
    console.log((await smcTTWUser.run({ functionName: "getBalance" })).value);
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "reclaimDeposit",
      input: {
        votes: 100000,
        returnTo: smcTTWUser.address,
      },
      dest: smcPadawan.address,
      value: 6_000_000_000,
    });
    await sleep(1000);
    console.log(
      `Padawan vote info: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log((await smcTTWUser.run({ functionName: "getBalance" })).value);
    await callThroughMultisig({
      client,
      smcSafeMultisigWallet,
      abi: smcPadawan.tonPackage.abi,
      functionName: "reclaimDeposit",
      input: {
        votes: 100000,
        returnTo: smcTTWUser.address,
      },
      dest: smcPadawan.address,
      value: 6_000_000_000,
    });
    await sleep(1000);
    console.log(
      `Padawan vote info: `,
      (await smcPadawan.run({ functionName: "getVoteInfo" })).value
    );
    console.log((await smcTTWUser.run({ functionName: "getBalance" })).value);
  });
});
