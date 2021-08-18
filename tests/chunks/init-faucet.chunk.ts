import { TonClient } from "@tonclient/core";
import pkgFaucet from "../../ton-packages/Faucet.package";
import pkgFaucetDebot from "../../ton-packages/FaucetDebot.package";
import { TonContract } from "@rsquad/ton-utils";

export default async (client: TonClient) => {
  const smcFaucet = new TonContract({
    client,
    name: "Faucet",
    tonPackage: pkgFaucet,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcFaucet.calcAddress();

  const smcFaucetDebot = new TonContract({
    client,
    name: "FaucetDebot",
    tonPackage: pkgFaucetDebot,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  smcFaucetDebot.calcAddress();

  return {
    smcFaucet,
    smcFaucetDebot,
  };
};
