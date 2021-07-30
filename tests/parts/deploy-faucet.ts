import { TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
const fs = require("fs");

export default async (
  smcSafeMultisigWallet: TonContract,
  smcFaucet: TonContract,
  addrTokenRoot: string,
  addrTokenWallet: string
) => {
  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcFaucet.address,
    value: 3_000_000_000,
  });

  await smcFaucet.deploy({
    input: {
      addrTokenRoot: addrTokenRoot,
      addrTokenWallet,
    },
  });

  console.log(`Faucet deployed: ${smcFaucet.address}`);
  console.log(`public: ${smcFaucet.keys.public}`);
  console.log(`secret: ${smcFaucet.keys.secret}`);

  fs.writeFileSync("./fk", JSON.stringify(smcFaucet.keys));

  return smcFaucet;
};
