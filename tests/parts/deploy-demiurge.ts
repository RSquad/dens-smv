import { TonClient } from "@tonclient/core";
import pkgDemiurge from "../../ton-packages/Demiurge.package";
import { expect } from "chai";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { sleep, TonContract } from "@rsquad/ton-utils";
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
    value: 100_000_000_000,
  });

  const { transaction: tx } = await smcDemiurge.deploy({
    input: {
      addrStore: smcDemiurgeStore.address,
    },
  });

  console.log(`Demiurge address: ${smcDemiurge.address}`);

  // // TODO add correct wait

  // await waitForTransaction(
  //   client,
  //   {
  //     account_addr: { eq: smcDemiurge.address },
  //     in_message: {
  //       src: { eq: smcDemiurgeStore.address },
  //     },
  //     now: { ge: tx.now },
  //     aborted: { eq: false },
  //   },
  //   "now aborted"
  // );
  if (process.env.NETWORK !== "LOCAL") {
    await sleep(30000);
  }

  const stored = (await smcDemiurge.run({ functionName: "getStored" })).value;

  // console.log(stored)

  expect(stored.codePadawan).is.not.eq(EMPTY_CODE);
  expect(stored.codeProposal).is.not.eq(EMPTY_CODE);
  expect(stored.addrStore).is.eq(smcDemiurgeStore.address);
  expect(stored.addrDensRoot).is.not.eq(EMPTY_ADDRESS);
  expect(stored.addrTokenRoot).is.not.eq(EMPTY_ADDRESS);

  return smcDemiurge;
};
