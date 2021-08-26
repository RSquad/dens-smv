import { TonClient } from "@tonclient/core";
import pkgSmvRootStore from "../../ton-packages/SmvRootStore.package";
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
  const keys = await client.crypto.generate_random_sign_keys();
  const smcSmvRootStore = new TonContract({
    client,
    name: "SmvRootStore",
    tonPackage: pkgSmvRootStore,
    keys,
  });

  await smcSmvRootStore.calcAddress();

  await sendThroughMultisig({
    smcSafeMultisigWallet,
    dest: smcSmvRootStore.address,
    value: 3_000_000_000,
  });

  await smcSmvRootStore.deploy();

  const isSmcSmvRootStoreActive = await isAddrActive(
    client,
    smcSmvRootStore.address
  );
  expect(isSmcSmvRootStoreActive).to.be.true;

  console.log(`SmvRootStore address: ${smcSmvRootStore.address}`);
  console.log(`SmvRootStore public: ${keys.public}`);
  console.log(`SmvRootStore secret: ${keys.secret}`);

  await smcSmvRootStore.call({
    functionName: "setProposalCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgProposal.image }),
  });
  await smcSmvRootStore.call({
    functionName: "setPadawanCode",
    input: await client.boc.get_code_from_tvc({ tvc: pkgPadawan.image }),
  });

  await smcSmvRootStore.call({
    functionName: "setClientAddr",
    input: {
      addr: "0:0000000000000000000000000000000000000000000000000000000000000001",
    },
  });
  await smcSmvRootStore.call({
    functionName: "setTokenRootAddr",
    input: { addr: smcTokenRoot.address },
  });
  await smcSmvRootStore.call({
    functionName: "setFaucetAddr",
    input: { addr: smcFaucet.address },
  });

  const codes = Object.values(
    (await smcSmvRootStore.run({ functionName: "_codes" })).value._codes
  );

  expect(codes).to.have.lengthOf(2);
  codes.forEach((code) => {
    expect(code).to.not.be.eq(EMPTY_CODE);
  });

  const addrs = Object.values(
    (await smcSmvRootStore.run({ functionName: "_addrs" })).value._addrs
  );
  expect(addrs).to.have.lengthOf(3);
  addrs.forEach((addr) => {
    expect(addr).to.not.be.eq(EMPTY_ADDRESS);
  });

  return { smcSmvRootStore };
};
