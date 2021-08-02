import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../ton-packages/SafeMultisigWallet.package";
import { createClient, TonContract } from "@rsquad/ton-utils";
import initChunk from "./init.chunk";

describe("Debot test", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcTestRoot: TonContract;
  let smcDemiurgeStore: TonContract;
  let smcDemiurge: TonContract;
  let smcTokenRoot: TonContract;
  let smcFaucetTokenWallet: TonContract;
  let smcFaucetDebot: TonContract;
  let smcFaucet: TonContract;
  let smcDemiurgeDebot: TonContract;

  before(async () => {
    client = createClient();
    smcSafeMultisigWallet = new TonContract({
      client,
      name: "SafeMultisigWallet",
      tonPackage: pkgSafeMultisigWallet,
      address: process.env.MULTISIG_ADDRESS,
      keys: {
        public: process.env.MULTISIG_PUBKEY,
        secret: process.env.MULTISIG_SECRET,
      },
    });
  });

  it("Init system", async () => {
    const contracts = await initChunk(client, smcSafeMultisigWallet);
    smcDemiurgeStore = contracts.smcDemiurgeStore;
    smcDemiurge = contracts.smcDemiurge;
    smcTokenRoot = contracts.smcTokenRoot;
    smcFaucetTokenWallet = contracts.smcFaucetTokenWallet;
    smcFaucetDebot = contracts.smcFaucetDebot;
    smcFaucet = contracts.smcFaucet;
    smcDemiurgeDebot = contracts.smcDemiurgeDebot;
  });
});
