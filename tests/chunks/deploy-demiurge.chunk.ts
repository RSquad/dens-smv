import { TonClient } from "@tonclient/core";
import pkgDemiurge from "../../ton-packages/Demiurge.package";
import { sleep, TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import { EMPTY_ADDRESS, EMPTY_CODE } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcDemiurgeStore: TonContract
) => {
  const smcDemiurge = new TonContract({
    client,
    name: "Demiurge",
    tonPackage: pkgDemiurge,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurge.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurge.address,
    value: 10_000_000_000,
  });

  await smcDemiurge.deploy({
    input: {
      addrStore: smcDemiurgeStore.address,
    },
  });

  const isSmcDemiurgeActive = await isAddrActive(client, smcDemiurge.address);
  expect(isSmcDemiurgeActive).to.be.true;

  console.log(`Demiurge address: ${smcDemiurge.address}`);

  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  const stored = (await smcDemiurge.run({ functionName: "getStored" })).value;
  expect(Object.keys(stored)).to.have.lengthOf(6);
  expect(stored.codePadawan, "codePadawan is empty").to.be.not.eq(EMPTY_CODE);
  expect(stored.codeProposal, "codeProposal is empty").to.be.not.eq(EMPTY_CODE);
  expect(stored.addrStore, "addrStore is empty").to.be.not.eq(EMPTY_ADDRESS);
  expect(stored.addrDensRoot, "addrDensRoot is empty").to.be.not.eq(
    EMPTY_ADDRESS
  );
  expect(stored.addrTokenRoot, "addrTokenRoot is empty").to.be.not.eq(
    EMPTY_ADDRESS
  );
  expect(stored.addrFaucet, "addrFaucet is empty").to.be.not.eq(EMPTY_ADDRESS);

  return { smcDemiurge };
};
