import { ClientConfig } from "@polywrap/client-js";
import { Connection, Connections, ethereumPlugin } from "@polywrap/ethereum-plugin-js";
import path from "path";

export function getConfig(
  wrapperUri: string,
  tokenUri: string,
  mainnetProvider: string,
): Partial<ClientConfig> {
  return {
    redirects: [
      {
        from: "ens/ethereum.token.resolvers.defiwrapper.eth",
        to: tokenUri,
      },
      {
        from: "ens/1inch.asset.resolvers.defiwrapper.eth",
        to: wrapperUri,
      },
    ],
    plugins: [
      {
        uri: "wrap://ens/ethereum.polywrap.eth",
        plugin: ethereumPlugin({
          connections: new Connections({
            networks: {
              mainnet: new Connection({ provider: mainnetProvider }),
            },
            defaultNetwork: "mainnet",
          }),
        }),
      },
    ],
    envs: [
      {
        uri: wrapperUri,
        env: {
          connection: {
            networkNameOrChainId: "mainnet",
          },
        },
      },
    ],
  };
}

export function getWrapperPaths(): { wrapperAbsPath: string; tokenResolverAbsPath: string } {
  const wrapperRelPath: string = path.join(__dirname, "..");
  const wrapperAbsPath: string = path.resolve(wrapperRelPath);
  const tokenRelPath: string = path.join(
    wrapperAbsPath,
    "../../..",
    "token-resolvers",
    "resolvers",
    "ethereum",
  );
  const tokenResolverAbsPath = path.resolve(tokenRelPath);

  return { wrapperAbsPath, tokenResolverAbsPath };
}
