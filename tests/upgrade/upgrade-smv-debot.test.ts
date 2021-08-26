import { TonClient } from "@tonclient/core";
import pkgSafeMultisigWallet from "../../ton-packages/SafeMultisigWallet.package";
import pkgSmvDebot from "../../ton-packages/SmvDebot.package";
import { createClient, TonContract } from "@rsquad/ton-utils";
import * as fs from "fs";

describe("Update SMV Debot", () => {
  let client: TonClient;
  let smcSafeMultisigWallet: TonContract;
  let smcSmvDebot: TonContract;

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

  it("upgrades debot", async () => {
    let raw = fs.readFileSync("./creds/smv-debot-address");
    const addrSmvDebot = JSON.parse(raw as any).address;
    raw = fs.readFileSync("./creds/smv-debot-keys");
    const keysSmvDebot = JSON.parse(raw as any);

    smcSmvDebot = new TonContract({
      address: addrSmvDebot,
      keys: keysSmvDebot,
      client,
      name: "SmvDebot",
      tonPackage: pkgSmvDebot,
    });

    await smcSmvDebot.call({
      functionName: "upgrade",
      input: {
        state: pkgSmvDebot.image,
      },
    });

    await new Promise<void>((resolve) => {
      fs.readFile(
        "./build/SmvDebot.abi.json",
        "utf8",
        async function (err, data) {
          if (err) {
            return console.log({ err });
          }
          const buf = Buffer.from(data, "ascii");
          var hexvalue = buf.toString("hex");

          await smcSmvDebot.call({
            functionName: "setABI",
            input: {
              dabi: hexvalue,
            },
          });

          resolve();
        }
      );
    });
    raw = fs.readFileSync("./creds/smv-root-address");
    const addrSmvRoot = JSON.parse(raw as any).address;
    raw = fs.readFileSync("./creds/smv-root-store-address");
    const addrSmvRootStore = JSON.parse(raw as any).address;
    raw = fs.readFileSync("./creds/faucet-debot-address");
    const addrFaucetDebot = JSON.parse(raw as any).address;

    await smcSmvDebot.call({
      functionName: "init",
      input: {
        smvRoot: addrSmvRoot,
        store: addrSmvRootStore,
        faucetDebot: addrFaucetDebot,
      },
    });
  });
});
