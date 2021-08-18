import { TonClient } from "@tonclient/core";
import pkgTokenRoot from "../../ton-packages/RT.package";
import pkgTokenWallet from "../../ton-packages/TTW.package";
import pkgFaucetDebot from "../../ton-packages/FaucetDebot.package";
import { TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import * as fs from "fs";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcFaucetDebot: TonContract,
  smcFaucet: TonContract,
  smcTokenRoot: TonContract,
  smcFaucetTokenWallet: TonContract
) => {
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

  const isSmcFaucetDebotActive = await isAddrActive(
    client,
    smcFaucetDebot.address
  );
  expect(isSmcFaucetDebotActive).to.be.true;

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

  return { smcFaucetDebot };
};
