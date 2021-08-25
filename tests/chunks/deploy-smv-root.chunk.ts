import { TonClient } from "@tonclient/core";
import pkgSmvRoot from "../../ton-packages/SmvRoot.package";
import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import { EMPTY_ADDRESS, EMPTY_CODE } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcSmvRootStore: TonContract
) => {
  const smcSmvRoot = new TonContract({
    client,
    name: "SmvRoot",
    tonPackage: pkgSmvRoot,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcSmvRoot.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcSmvRoot.address,
    value: 10_000_000_000,
  });

  await smcSmvRoot.deploy({
    input: {
      addrStore: smcSmvRootStore.address,
    },
  });

  const isSmcSmvRootActive = await isAddrActive(client, smcSmvRoot.address);
  expect(isSmcSmvRootActive).to.be.true;

  console.log(`SmvRoot address: ${smcSmvRoot.address}`);

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  const stored = (await smcSmvRoot.run({ functionName: "getStored" })).value;
  expect(Object.keys(stored)).to.have.lengthOf(6);
  expect(stored.codePadawan, "codePadawan is empty").to.be.not.eq(EMPTY_CODE);
  expect(stored.codeProposal, "codeProposal is empty").to.be.not.eq(EMPTY_CODE);
  expect(stored.addrStore, "addrStore is empty").to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrClient, "addrClient is empty").to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrTokenRoot, "addrTokenRoot is empty").to.be.not.eq(
    EMPTY_ADDRESS
  );
  expect(stored.addrFaucet, "addrFaucet is empty").to.be.not.eq(EMPTY_ADDRESS);

  return { smcSmvRoot };
};
