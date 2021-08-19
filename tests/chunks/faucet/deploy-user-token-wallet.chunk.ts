import { TonClient } from "@tonclient/core";
import pkgTokenRoot from "../../../ton-packages/RT.package";
import pkgTokenWallet from "../../../ton-packages/TTW.package";
import pkgFaucetDebot from "../../../ton-packages/FaucetDebot.package";
import { TonContract } from "@rsquad/ton-utils";
import { isAddrActive } from "../../utils";
import { expect } from "chai";
import * as fs from "fs";
import { EMPTY_ADDRESS } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcTokenRoot: TonContract,
  smcFaucet: TonContract
) => {
  const raw = fs.readFileSync("./k1");
  await smcFaucet.call({
    functionName: "deployWallet",
    keys: JSON.parse(raw as any),
  });

  const addrUserTokenWallet = (
    await smcTokenRoot.run({
      functionName: "getWalletAddress",
      input: {
        pubkey: `0x${JSON.parse(raw as any).public}`,
        owner: EMPTY_ADDRESS,
      },
    })
  ).value.value0;

  const isUserTokenWalletActive = await isAddrActive(
    client,
    addrUserTokenWallet
  );
  expect(isUserTokenWalletActive, "UserTokenWallet not active").to.be.true;

  console.log(`UserTokenWallet deployed: ${addrUserTokenWallet}`);

  const smcUserTokenWallet = new TonContract({
    client,
    name: "UserTokenWallet",
    tonPackage: pkgTokenWallet,
    address: addrUserTokenWallet,
  });

  return { smcUserTokenWallet };
};
