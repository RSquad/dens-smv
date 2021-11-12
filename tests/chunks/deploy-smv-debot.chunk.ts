import { TonClient } from "@tonclient/core";
import pkgSmvDebot from "../../ton-packages/SmvDebot.package";
import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import * as fs from "fs";
import { NETWORK_MAP } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcSmvDebot: TonContract,
  smcSmvRoot: TonContract,
  smcTokenRoot: TonContract,
  smcFaucet: TonContract
) => {
  const keys = await client.crypto.generate_random_sign_keys();
  smcSmvDebot = new TonContract({
    client,
    name: "SmvDebot",
    tonPackage: pkgSmvDebot,
    keys,
  });

  await smcSmvDebot.calcAddress();

  console.log(`SmvDebot deploy: ${smcSmvDebot.address}`);
  console.log(`public: ${smcSmvDebot.keys.public}`);
  console.log(`secret: ${smcSmvDebot.keys.secret}`);

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcSmvDebot.address,
    value: 5_000_000_000,
  });

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  await smcSmvDebot.deploy();

  await new Promise<void>((resolve) => {
    fs.readFile(
      "./build/SmvDebot.abi.json",
      "utf8",
      async function (err, data) {
        if (err) {
          return console.log({ err });
        }
        const buf = Buffer.from(data, "ascii");
        var hexvalue = buf.toString("hex");

        await smcSmvDebot.call({
          functionName: "setABI",
          input: {
            dabi: hexvalue,
          },
        });

        resolve();
      }
    );
  });

  await smcSmvDebot.call({
    functionName: "init",
    input: {
      smvRoot: smcSmvRoot.address,
      faucet: smcFaucet.address,
      tokenRoot: smcTokenRoot.address,
    },
  });

  const isSmcSmvDebotActive = await isAddrActive(client, smcSmvDebot.address);
  expect(isSmcSmvDebotActive).to.be.true;

  console.log(
    `tonos-cli --url ${NETWORK_MAP[process.env.NETWORK][0]} debot fetch ${
      smcSmvDebot.address
    }`
  );

  return { smcSmvDebot };
};
