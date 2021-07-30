import { TonClient } from "@tonclient/core";
import pkgTokenRoot from "../../ton-packages/RT.package";
import pkgTokenWallet from "../../ton-packages/TTW.package";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import { TonContract } from "@rsquad/ton-utils";
const fs = require("fs");

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  addrFaucet: string
) => {
  const smcTokenRoot = new TonContract({
    client,
    name: "TokenRoot",
    tonPackage: pkgTokenRoot,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcTokenRoot.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcTokenRoot.address,
    value: 3_000_000_000,
  });

  await smcTokenRoot.deploy({
    input: {
      name: utf8ToHex("DeNS Token"),
      symbol: utf8ToHex("DENS"),
      decimals: 0,
      root_public_key: `0x${smcTokenRoot.keys.public}`,
      root_owner: "0x0",
      wallet_code: (
        await client.boc.get_code_from_tvc({ tvc: pkgTokenWallet.image })
      ).code,
      total_supply: 21000000,
    },
  });

  console.log(`TokenRoot deployed: ${smcTokenRoot.address}`);
  console.log(`public: ${smcTokenRoot.keys.public}`);
  console.log(`secret: ${smcTokenRoot.keys.secret}`);

  const smcFaucetTokenWallet = new TonContract({
    client,
    name: "FaucetTokenWallet",
    tonPackage: pkgTokenWallet,
    keys: smcTokenRoot.keys,
  });

  fs.writeFileSync("./tk", JSON.stringify(smcTokenRoot.keys));

  const deployFaucetTokenWallet = await smcTokenRoot.call({
    functionName: "deployWallet",
    input: {
      _answer_id: 1,
      workchain_id: 0,
      pubkey: 0,
      internal_owner: `0x${addrFaucet.slice(2)}`,
      tokens: 21000000,
      grams: 1_000_000_000,
    },
  });

  smcFaucetTokenWallet.address = deployFaucetTokenWallet.decoded.output.value0;

  console.log(`TokenWalletFaucet deployed: ${smcFaucetTokenWallet.address}`);
  console.log(`public: ${smcFaucetTokenWallet.keys.public}`);
  console.log(`secret: ${smcFaucetTokenWallet.keys.secret}`);

  return [smcTokenRoot, smcFaucetTokenWallet];
};
