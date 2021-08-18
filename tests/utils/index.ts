import { TonClient } from "@tonclient/core";

export const isAddrActive = async (client: TonClient, addr: string) => {
  const { result } = await client.net.query_collection({
    collection: "accounts",
    filter: { id: { eq: addr } },
    result: "acc_type",
  });
  if (result[0] && result[0].acc_type == 1) return true;
  return false;
};
