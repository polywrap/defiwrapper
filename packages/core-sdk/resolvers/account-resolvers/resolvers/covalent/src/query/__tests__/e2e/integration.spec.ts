import { QueryApiResult, Web3ApiClient } from "@web3api/client-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import path from "path";

import { AccountResolver_TokenBalance } from "../../w3";
import { getPlugins } from "../utils";
import { GetTokenBalancesResponse } from "./types";

jest.setTimeout(500000);

describe("Ethereum", () => {
  let client: Web3ApiClient;
  let ensUri: string;
  let tokenEnsUri: string;

  beforeAll(async () => {
    const { ethereum: testEnvEtherem, ensAddress, ipfs } = await initTestEnvironment();
    // deploy api
    const apiPath: string = path.join(path.resolve(__dirname), "..", "..", "..", "..");
    const api = await buildAndDeployApi(apiPath, ipfs, ensAddress);
    ensUri = `ens/testnet/${api.ensDomain}`;

    // deploy token defiwrapper
    const tokenApiPath: string = path.join(apiPath, "..", "..", "..", "..", "token");
    const tokenApi = await buildAndDeployApi(tokenApiPath, ipfs, ensAddress);
    tokenEnsUri = `ens/testnet/${tokenApi.ensDomain}`;

    // get client
    const config = getPlugins(testEnvEtherem, ipfs, ensAddress);
    config.envs = [
      {
        uri: ensUri,
        query: {
          apiKey: process.env.COVALENT_API_KEY || "ckey_910089969da7451cadf38655ede",
          chainId: 1,
        },
      },
      {
        uri: "ens/token.defiwrapper.eth",
        query: {
          connection: {
            networkNameOrChainId: "1",
          },
        },
      },
    ];
    if (config.redirects) {
      config.redirects.push({
        to: tokenEnsUri,
        from: "ens/token.defiwrapper.eth",
      });
    } else {
      config.redirects = [
        {
          to: tokenEnsUri,
          from: "ens/token.defiwrapper.eth",
        },
      ];
    }
    client = new Web3ApiClient(config);
  });

  afterAll(async () => {
    await stopTestEnvironment();
  });

  describe("getTokenBalances", () => {
    const getTokenBalances = async (
      address: string,
    ): Promise<QueryApiResult<GetTokenBalancesResponse>> => {
      const response = await client.query<GetTokenBalancesResponse>({
        uri: ensUri,
        query: `
          query GetTokenBalances($address: String!) {
            getTokenBalances(
              address: $address
            )
          }
        `,
        variables: {
          address: address,
        },
      });
      return response;
    };

    test("0x9bA00D6856a4eDF4665BcA2C2309936572473B7E", async () => {
      const result = await getTokenBalances("0x9bA00D6856a4eDF4665BcA2C2309936572473B7E");

      expect(result.errors).toBeFalsy();
      expect(result.data).toBeTruthy();
      const tokenBalances = result.data?.getTokenBalances as AccountResolver_TokenBalance[];
      expect(
        tokenBalances.find((x) => x.token.address === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
      );
    });
  });
});
