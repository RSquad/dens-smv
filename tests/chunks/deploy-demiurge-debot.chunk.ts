import { TonClient } from "@tonclient/core";
import pkgDemiurgeDebot from "../../ton-packages/DemiurgeDebot.package";
import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import * as fs from "fs";
import { NETWORK_MAP } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcDemiurgeDebot: TonContract,
  smcDemiurge: TonContract,
  smcDemiurgeStore: TonContract,
  smcFaucetDebot: TonContract
) => {
  const keys = await client.crypto.generate_random_sign_keys();
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
    await sleep(30000);
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

  const isSmcDemiurgeDebotActive = await isAddrActive(
    client,
    smcDemiurgeDebot.address
  );
  expect(isSmcDemiurgeDebotActive).to.be.true;

  console.log(
    `tonos-cli --url ${NETWORK_MAP[process.env.NETWORK][0]} debot fetch ${
      smcDemiurgeDebot.address
    }`
  );

  return { smcDemiurgeDebot };
};
