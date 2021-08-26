import { TonClient } from "@tonclient/core";
import { logPubGetter, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import * as fs from "fs";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcFaucet: TonContract,
  smcTokenRoot: TonContract,
  smcFaucetTokenWallet: TonContract
) => {
  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcFaucet.address,
    value: 5_000_000_000,
  });

  await smcFaucet.deploy({
    input: {
      addrTokenRoot: smcTokenRoot.address,
      addrTokenWallet: smcFaucetTokenWallet.address,
    },
  });

  const isSmcFaucetActive = await isAddrActive(client, smcFaucet.address);
  expect(isSmcFaucetActive).to.be.true;

  const addrTokenRoot = (
    await smcFaucet.run({ functionName: "_addrTokenRoot" })
  ).value._addrTokenRoot;
  const addrTokenWallet = (
    await smcFaucet.run({ functionName: "_addrTokenWallet" })
  ).value._addrTokenWallet;
  expect(addrTokenRoot).to.be.eq(smcTokenRoot.address);
  expect(addrTokenWallet).to.be.eq(smcFaucetTokenWallet.address);

  console.log(`Faucet deployed: ${smcFaucet.address}`);
  console.log(`public: ${smcFaucet.keys.public}`);
  console.log(`secret: ${smcFaucet.keys.secret}`);

  fs.writeFileSync("./keys/faucet-keys", JSON.stringify(smcFaucet.keys));

  return { smcFaucet };
};
