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
    value: 3_000_000_000,
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

  fs.writeFileSync("./fk", JSON.stringify(smcFaucet.keys));

  let keys = await client.crypto.generate_random_sign_keys();
  await smcFaucet.call({
    functionName: "changeBalance",
    input: {
      pubkey: `0x${keys.public}`,
      value: 1000,
    },
  });

  const balances = (await smcFaucet.run({ functionName: "_balances" })).value
    ._balances;
  expect(balances[`0x${keys.public}`]).to.be.eq("1000");

  logPubGetter("Faucet balances updated", smcFaucet, "_balances");

  fs.writeFileSync("./k1", JSON.stringify(keys));

  return { smcFaucet };
};
