import { TonClient } from "@tonclient/core";
import pkgDemiurgeStore from "../../ton-packages/DemiurgeStore.package";
import pkgPadawan from "../../ton-packages/Padawan.package";
import pkgProposal from "../../ton-packages/Proposal.package";
import pkgDemiurge from "../../ton-packages/Demiurge.package";
import { sendThroughMultisig } from "@rsquad/ton-utils/dist/net";
import { TonContract } from "@rsquad/ton-utils";

export default async (
  client: TonClient,
  smcSafeMultisigWallet: TonContract,
  addrDensRoot: string,
  addrTokenRoot: string
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
    value: 100_000_000_000,
  });

  await smcDemiurgeStore.deploy();

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
    input: { addr: addrDensRoot },
  });
  await smcDemiurgeStore.call({
    functionName: "setTokenRootAddr",
    input: { addr: addrTokenRoot },
  });

  return smcDemiurgeStore;
};
