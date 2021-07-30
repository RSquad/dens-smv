import { TonContract } from "@rsquad/ton-utils";
import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../../ton-packages/SafeMultisigWallet.package";
const fs = require("fs");

export default async (client: TonClient, smcGiver: TonContract) => {
  const keys = await client.crypto.generate_random_sign_keys();
  const smcSafeMultisigWallet = new TonContract({
    client,
    name: "SafeMultisigWallet",
    tonPackage: pkgSafeMultisigWallet,
    keys,
  });

  fs.writeFileSync("./mtsg-keys.json", JSON.stringify(keys));

  await smcSafeMultisigWallet.calcAddress();

  await smcGiver.call({
    functionName: "sendGrams",
    input: {
      dest: smcSafeMultisigWallet.address,
      amount: 100_000_000_000,
    },
  });

  console.log(`SafeMultisigWallet address: ${smcSafeMultisigWallet.address}`);

  await smcSafeMultisigWallet.deploy({
    input: {
      owners: [`0x${smcSafeMultisigWallet.keys.public}`],
      reqConfirms: 1,
    },
  });

  return smcSafeMultisigWallet;
};
