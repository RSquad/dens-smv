import { TonClient } from "@tonclient/core";
import pkgTokenRoot from "../../ton-packages/RT.package";
import pkgTokenWallet from "../../ton-packages/TTW.package";
import pkgFaucetDebot from "../../ton-packages/FaucetDebot.package";
import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { utf8ToHex } from "@rsquad/ton-utils/dist/convert";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import * as fs from "fs";

export default async (
  client: TonClient,
  smcTokenRoot: TonContract,
  smcFaucet: TonContract
) => {
  const smcFaucetTokenWallet = new TonContract({
    client,
    name: "FaucetTokenWallet",
    tonPackage: pkgTokenWallet,
    keys: smcTokenRoot.keys,
  });

  fs.writeFileSync("./ftwk", JSON.stringify(smcTokenRoot.keys));

  const deployFaucetTokenWallet = await smcTokenRoot.call({
    functionName: "deployWallet",
    input: {
      _answer_id: 0,
      pubkey: 0,
      internal_owner: smcFaucet.address,
      tokens: 21000000,
      grams: 1_000_000_000,
    },
  });

  smcFaucetTokenWallet.address = deployFaucetTokenWallet.decoded.output.value0;

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  const isSmcFaucetTokenWalletActive = await isAddrActive(
    client,
    smcFaucetTokenWallet.address
  );
  expect(isSmcFaucetTokenWalletActive).to.be.true;

  console.log(`FaucetTokenWallet deployed: ${smcFaucetTokenWallet.address}`);
  console.log(`public: ${smcFaucetTokenWallet.keys.public}`);
  console.log(`secret: ${smcFaucetTokenWallet.keys.secret}`);

  return { smcFaucetTokenWallet };
};
