import { KeyPair, TonClient } from "@tonclient/core";
import pkgFaucet from "../ton-packages/Faucet.package";
import pkgFaucetDebot from "../ton-packages/FaucetDebot.package";
import pkgTokenRoot from "../ton-packages/RT.package";
import pkgTokenWallet from "../ton-packages/TTW.package";
import pkgPadawan from "../ton-packages/Padawan.package";
import pkgProposal from "../ton-packages/Proposal.package";
import pkgDemiurgeStore from "../ton-packages/DemiurgeStore.package";
import pkgDemiurge from "../ton-packages/Demiurge.package";
import pkgDemiurgeDebot from "../ton-packages/DemiurgeDebot.package";
import { expect } from "chai";
import { logPubGetter, sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import * as fs from "fs";
import {
  EMPTY_ADDRESS,
  EMPTY_CODE,
  NETWORK_MAP,
} from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract
) => {
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcDemiurge: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurgeDebot: TonContract;
  let keysTestUser: KeyPair;

  /* -------------------------------------------------------------------------- */
  /*                             ANCHOR Init Faucet                             */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                           ANCHOR Deploy TokenRoot                          */
  /* -------------------------------------------------------------------------- */

  smcTokenRoot = new TonContract({
    client,
    name: "TokenRoot",
    tonPackage: pkgTokenRoot,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcTokenRoot.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcTokenRoot.address,
    value: 2_000_000_000,
  });

  await smcTokenRoot.deploy({
    input: {
      name: utf8ToHex("DeNS Token"),
      symbol: utf8ToHex("DENS"),
      decimals: 0,
      root_public_key: `0x${smcTokenRoot.keys.public}`,
      root_owner: "0x0",
      wallet_code: (
        await client.boc.get_code_from_tvc({ tvc: pkgTokenWallet.image })
      ).code,
      total_supply: 21000000,
    },
  });

  console.log(`TokenRoot deployed: ${smcTokenRoot.address}`);
  console.log(`public: ${smcTokenRoot.keys.public}`);
  console.log(`secret: ${smcTokenRoot.keys.secret}`);

  /* -------------------------------------------------------------------------- */
  /*                       ANCHOR Deploy FaucetTokenWallet                      */
  /* -------------------------------------------------------------------------- */

  smcFaucetTokenWallet = new TonContract({
    client,
    name: "FaucetTokenWallet",
    tonPackage: pkgTokenWallet,
    keys: smcTokenRoot.keys,
  });

  fs.writeFileSync("./ftwk", JSON.stringify(smcTokenRoot.keys));

  const deployFaucetTokenWallet = await smcTokenRoot.call({
    functionName: "deployWallet",
    input: {
      _answer_id: 1,
      workchain_id: 0,
      pubkey: 0,
      internal_owner: `0x${smcFaucet.address.slice(2)}`,
      tokens: 21000000,
      grams: 1_000_000_000,
    },
  });

  smcFaucetTokenWallet.address = deployFaucetTokenWallet.decoded.output.value0;

  console.log(`FaucetTokenWallet deployed: ${smcFaucetTokenWallet.address}`);
  console.log(`public: ${smcFaucetTokenWallet.keys.public}`);
  console.log(`secret: ${smcFaucetTokenWallet.keys.secret}`);

  /* -------------------------------------------------------------------------- */
  /*                            ANCHOR Deploy Faucet                            */
  /* -------------------------------------------------------------------------- */

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcFaucet.address,
    value: 3_000_000_000,
  });

  await smcFaucet.deploy({
    input: {
      addrTokenRoot: smcTokenRoot.address,
      addrTokenWallet: smcFaucetTokenWallet.address,
    },
  });

  console.log(`Faucet deployed: ${smcFaucet.address}`);
  console.log(`public: ${smcFaucet.keys.public}`);
  console.log(`secret: ${smcFaucet.keys.secret}`);

  fs.writeFileSync("./ftwk", JSON.stringify(smcFaucet.keys));

  keysTestUser = await client.crypto.generate_random_sign_keys();
  await smcFaucet.call({
    functionName: "changeBalance",
    input: {
      pubkey: `0x${keysTestUser.public}`,
      value: 1000,
    },
  });

  logPubGetter("Faucet balances updated", smcFaucet, "_balances");

  fs.writeFileSync("./k1", JSON.stringify(keysTestUser));

  /* -------------------------------------------------------------------------- */
  /*                          ANCHOR Deploy FaucetDebot                         */
  /* -------------------------------------------------------------------------- */

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcFaucetDebot.address,
    value: 3_000_000_000,
  });

  await smcFaucetDebot.deploy({
    input: {
      addrFaucet: smcFaucet.address,
      addrTokenRoot: smcTokenRoot.address,
      addrFaucetTokenWallet: smcFaucetTokenWallet.address,
    },
  });

  console.log(`FaucetDebot deployed: ${smcFaucetDebot.address}`);
  console.log(`public: ${smcFaucetDebot.keys.public}`);
  console.log(`secret: ${smcFaucetDebot.keys.secret}`);

  await new Promise<void>((resolve) => {
    fs.readFile(
      "./build/FaucetDebot.abi.json",
      "utf8",
      async function (err, data) {
        if (err) {
          return console.log({ err });
        }

        const buf = Buffer.from(data, "ascii");
        const hexvalue = buf.toString("hex");

        await smcFaucetDebot.call({
          functionName: "setABI",
          input: {
            dabi: hexvalue,
          },
        });

        resolve();
      }
    );
  });

  /* -------------------------------------------------------------------------- */
  /*                         ANCHOR Deploy DemiurgeStore                        */
  /* -------------------------------------------------------------------------- */

  smcDemiurgeStore = new TonContract({
    client,
    name: "DemiurgeStore",
    tonPackage: pkgDemiurgeStore,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurgeStore.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurgeStore.address,
    value: 100_000_000_000,
  });

  await smcDemiurgeStore.deploy();

  console.log(`DemiurgeStore address: ${smcDemiurgeStore.address}`);

  await smcDemiurgeStore.call({
    functionName: "setProposalCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgProposal.image }),
  });
  await smcDemiurgeStore.call({
    functionName: "setPadawanCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgPadawan.image }),
  });

  await smcDemiurgeStore.call({
    functionName: "setDensRootAddr",
    input: {
      addr: "0:0000000000000000000000000000000000000000000000000000000000000001",
    },
  });
  await smcDemiurgeStore.call({
    functionName: "setTokenRootAddr",
    input: { addr: smcTokenRoot.address },
  });
  await smcDemiurgeStore.call({
    functionName: "setFaucetAddr",
    input: { addr: smcFaucet.address },
  });

  let codes = Object.values(
    (await smcDemiurgeStore.run({ functionName: "_codes" })).value._codes
  );

  expect(codes).to.have.lengthOf(2);
  codes.forEach((code) => {
    expect(code).to.not.be.eq(EMPTY_CODE);
  });

  let addrs = Object.values(
    (await smcDemiurgeStore.run({ functionName: "_addrs" })).value._addrs
  );
  expect(addrs).to.have.lengthOf(3);
  addrs.forEach((addr) => {
    expect(addr).to.not.be.eq(EMPTY_ADDRESS);
  });

  /* -------------------------------------------------------------------------- */
  /*                           ANCHOR Deploy Demiurge                           */
  /* -------------------------------------------------------------------------- */

  smcDemiurge = new TonContract({
    client,
    name: "Demiurge",
    tonPackage: pkgDemiurge,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurge.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurge.address,
    value: 100_000_000_000,
  });

  await smcDemiurge.deploy({
    input: {
      addrStore: smcDemiurgeStore.address,
    },
  });

  console.log(`Demiurge address: ${smcDemiurge.address}`);

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(20000);
  }

  const stored = (await smcDemiurge.run({ functionName: "getStored" })).value;
  expect(Object.keys(stored)).to.have.lengthOf(6);
  expect(stored.codePadawan).to.be.not.eq(EMPTY_CODE);
  expect(stored.codeProposal).to.be.not.eq(EMPTY_CODE);
  expect(stored.addrStore).to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrDensRoot).to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrTokenRoot).to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrFaucetWallet).to.be.not.eq(EMPTY_ADDRESS);

  /* -------------------------------------------------------------------------- */
  /*                         ANCHOR Deploy DemiurgeDebot                        */
  /* -------------------------------------------------------------------------- */

  let keys = await client.crypto.generate_random_sign_keys();
  smcDemiurgeDebot = new TonContract({
    client,
    name: "DemiurgeDebot",
    tonPackage: pkgDemiurgeDebot,
    keys,
  });

  fs.writeFileSync("./dk", JSON.stringify(keys));

  await smcDemiurgeDebot.calcAddress();

  console.log(`DemiurgeDebot deploy: ${smcDemiurgeDebot.address}`);
  console.log(`public: ${smcDemiurgeDebot.keys.public}`);
  console.log(`secret: ${smcDemiurgeDebot.keys.secret}`);

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurgeDebot.address,
    value: 100_000_000_000,
  });

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(20000);
  }

  await smcDemiurgeDebot.deploy({
    input: {
      demiurge: smcDemiurge.address,
      store: smcDemiurgeStore.address,
      faucetDebot: smcFaucetDebot.address,
    },
  });

  await new Promise<void>((resolve) => {
    fs.readFile(
      "./build/DemiurgeDebot.abi.json",
      "utf8",
      async function (err, data) {
        if (err) {
          return console.log({ err });
        }
        const buf = Buffer.from(data, "ascii");
        var hexvalue = buf.toString("hex");

        await smcDemiurgeDebot.call({
          functionName: "setABI",
          input: {
            dabi: hexvalue,
          },
        });

        resolve();
      }
    );
  });

  console.log(
    `tonos-cli --url ${NETWORK_MAP[process.env.NETWORK][0]} debot fetch ${
      smcDemiurgeDebot.address
    }`
  );

  return {
    contracts: {
      smcTokenRoot,
      smcFaucetTokenWallet,
      smcFaucet,
      smcFaucetDebot,
      smcDemiurge,
      smcDemiurgeStore,
      smcDemiurgeDebot,
    },
    keys: {
      keysTestUser,
    },
  };
};
