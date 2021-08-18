import { TonClient } from "@tonclient/core";
import pkgDemiurgeStore from "../../ton-packages/DemiurgeStore.package";
import pkgProposal from "../../ton-packages/Proposal.package";
import pkgPadawan from "../../ton-packages/Padawan.package";
import { TonContract } from "@rsquad/ton-utils";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { isAddrActive } from "../utils";
import { expect } from "chai";
import { EMPTY_ADDRESS, EMPTY_CODE } from "@rsquad/ton-utils/dist/constants";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  smcFaucet: TonContract,
  smcTokenRoot: TonContract
) => {
  const smcDemiurgeStore = new TonContract({
    client,
    name: "DemiurgeStore",
    tonPackage: pkgDemiurgeStore,
    keys: await client.crypto.generate_random_sign_keys(),
  });

  await smcDemiurgeStore.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcDemiurgeStore.address,
    value: 3_000_000_000,
  });

  await smcDemiurgeStore.deploy();

  const isSmcDemiurgeStoreActive = await isAddrActive(
    client,
    smcDemiurgeStore.address
  );
  expect(isSmcDemiurgeStoreActive).to.be.true;

  console.log(`DemiurgeStore address: ${smcDemiurgeStore.address}`);

  await smcDemiurgeStore.call({
    functionName: "setProposalCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgProposal.image }),
  });
  await smcDemiurgeStore.call({
    functionName: "setPadawanCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgPadawan.image }),
  });

  await smcDemiurgeStore.call({
    functionName: "setDensRootAddr",
    input: {
      addr: "0:0000000000000000000000000000000000000000000000000000000000000001",
    },
  });
  await smcDemiurgeStore.call({
    functionName: "setTokenRootAddr",
    input: { addr: smcTokenRoot.address },
  });
  await smcDemiurgeStore.call({
    functionName: "setFaucetAddr",
    input: { addr: smcFaucet.address },
  });

  const codes = Object.values(
    (await smcDemiurgeStore.run({ functionName: "_codes" })).value._codes
  );

  expect(codes).to.have.lengthOf(2);
  codes.forEach((code) => {
    expect(code).to.not.be.eq(EMPTY_CODE);
  });

  const addrs = Object.values(
    (await smcDemiurgeStore.run({ functionName: "_addrs" })).value._addrs
  );
  expect(addrs).to.have.lengthOf(3);
  addrs.forEach((addr) => {
    expect(addr).to.not.be.eq(EMPTY_ADDRESS);
  });

  return { smcDemiurgeStore };
};
