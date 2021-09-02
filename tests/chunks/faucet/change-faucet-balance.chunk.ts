import { TonClient } from "@tonclient/core";
import { logPubGetter, TonContract } from "@rsquad/ton-utils";
import { expect } from "chai";
import * as fs from "fs";

export default async (client: TonClient, smcFaucet: TonContract) => {
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
};
