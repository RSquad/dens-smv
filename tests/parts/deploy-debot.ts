import { sleep, TonContract } from "@rsquad/ton-utils";
import { NETWORK_MAP } from "@rsquad/ton-utils/dist/constants";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { TonClient } from "@tonclient/core";
import pkgDemiurgeDebot from "../../ton-packages/DemiurgeDebot.package";
const fs = require("fs");

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcDemiurge: TonContract,
  smcDemiurgeStore: TonContract,
  addrFaucetDebot: string
) => {
  const keys = await client.crypto.generate_random_sign_keys();
  const smcDemiurgeDebot = new TonContract({
    client,
    name: "DemiurgeDebot",
    tonPackage: pkgDemiurgeDebot,
    keys,
  });
  fs.writeFileSync("./dk", JSON.stringify(keys));

  await smcDemiurgeDebot.calcAddress();

  console.log(`DemiurgeDebot address: ${smcDemiurgeDebot.address},
      DemiurgeDebot public: ${smcDemiurgeDebot.keys.public},
      DemiurgeDebot secret: ${smcDemiurgeDebot.keys.secret}`);

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurgeDebot.address,
    value: 100_000_000_000,
  });

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  console.log(`DemiurgeDebot balance: ${await smcDemiurgeDebot.getBalance()}`);

  await smcDemiurgeDebot.deploy({
    input: {
      demiurge: smcDemiurge.address,
      store: smcDemiurgeStore.address,
      faucetDebot: addrFaucetDebot,
    },
  });

  console.log("deployed");

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

  return smcDemiurgeDebot;
};
