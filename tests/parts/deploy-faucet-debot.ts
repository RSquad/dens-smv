import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
const fs = require("fs");

export default async (
  smcSafeMultisigWallet: TonContract,
  smcFaucetDebot: TonContract,
  addrFaucet: string,
  addrTokenRoot: string,
  addrFaucetTokenWallet: string
) => {
  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcFaucetDebot.address,
    value: 3_000_000_000,
  });

  await smcFaucetDebot.deploy({
    input: {
      addrFaucet,
      addrTokenRoot,
      addrFaucetTokenWallet,
    },
  });

  console.log(`FaucetDebot deployed: ${smcFaucetDebot.address}`);
  console.log(`public: ${smcFaucetDebot.keys.public}`);
  console.log(`secret: ${smcFaucetDebot.keys.secret}`);

  // TODO: add waiting

  await sleep(1000);

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

  return smcFaucetDebot;
};
