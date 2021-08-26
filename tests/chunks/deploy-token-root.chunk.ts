import { TonClient } from "@tonclient/core";
import pkgTokenRoot from "../../ton-packages/RT.package";
import pkgTokenWallet from "../../ton-packages/TTW.package";
import { TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import { EMPTY_ADDRESS } from "@rsquad/ton-utils/dist/constants";
import * as fs from "fs";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract
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
    value: 5_000_000_000,
  });

  const codeWallet = (
    await client.boc.get_code_from_tvc({ tvc: pkgTokenWallet.image })
  ).code;

  await smcTokenRoot.deploy({
    input: {
      name: utf8ToHex("DeNS Token"),
      symbol: utf8ToHex("DENS"),
      decimals: 0,
      root_public_key: `0x${smcTokenRoot.keys.public}`,
      root_owner: EMPTY_ADDRESS,
      total_supply: 21000000,
    },
  });

  const isSmcTokenRootActive = await isAddrActive(client, smcTokenRoot.address);
  expect(isSmcTokenRootActive).to.be.true;

  console.log(`TokenRoot deployed: ${smcTokenRoot.address}`);
  console.log(`public: ${smcTokenRoot.keys.public}`);
  console.log(`secret: ${smcTokenRoot.keys.secret}`);

  await smcTokenRoot.call({
    functionName: "setWalletCode",
    input: {
      _answer_id: 0,
      wallet_code: codeWallet,
    },
  });

  expect(
    (await smcTokenRoot.run({ functionName: "getWalletCode" })).value.value0
  ).to.be.eq(codeWallet);

  fs.writeFileSync("./keys/token-root-keys", JSON.stringify(smcTokenRoot.keys));

  return { smcTokenRoot };
};
