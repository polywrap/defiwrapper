import { BigInt } from "@web3api/wasm-as";
import { Big } from "as-big";

import { ETH_ADDRESS, getCEthAddress } from "../constants";
import { getChainId } from "../utils/network";
import {
  env,
  Ethereum_Query,
  Input_getTokenComponents,
  Interface_TokenComponent,
  QueryEnv,
  Token_Query,
  Token_TokenType,
} from "../w3";

export function getTokenComponents(input: Input_getTokenComponents): Interface_TokenComponent {
  if (env == null) throw new Error("env is not set");
  const connection = (env as QueryEnv).connection;

  const token = Token_Query.getToken({
    address: input.tokenAddress,
    m_type: Token_TokenType.ERC20,
  }).unwrap();

  const returnOnFailure: Interface_TokenComponent = {
    tokenAddress: token.address,
    unresolvedComponents: 1,
    components: [],
    rate: "1",
  };

  const chainId: BigInt | null = getChainId(connection);
  if (!chainId) {
    return returnOnFailure;
  }

  let underlyingTokenAddress: string;
  let underlyingDecimals: i32;
  if (token.address == getCEthAddress(chainId.toUInt32())) {
    underlyingTokenAddress = ETH_ADDRESS;
    underlyingDecimals = 18;
  } else {
    const underlyingTokenAddressRes = Ethereum_Query.callContractView({
      address: token.address,
      method: "function underlying() view returns (address)",
      args: null,
      connection: connection,
    });
    if (underlyingTokenAddressRes.isErr) {
      return returnOnFailure;
    }
    underlyingTokenAddress = underlyingTokenAddressRes.unwrap();

    const underlyingTokenRes = Token_Query.getToken({
      address: underlyingTokenAddress,
      m_type: Token_TokenType.ERC20,
    });
    if (underlyingTokenRes.isErr) {
      return returnOnFailure;
    }
    underlyingDecimals = underlyingTokenRes.unwrap().decimals;
  }

  const exchangeRateRes = Ethereum_Query.callContractView({
    address: token.address,
    method: "function exchangeRateStored() public view returns (uint)",
    args: null,
    connection: connection,
  });
  if (exchangeRateRes.isErr) {
    return returnOnFailure;
  }
  const adjDecimals: string = BigInt.fromUInt16(10)
    .pow(18 - 8 + underlyingDecimals)
    .toString();
  const rate: string = Big.of(exchangeRateRes.unwrap()).div(Big.of(adjDecimals)).toString();

  const component: Interface_TokenComponent = {
    tokenAddress: underlyingTokenAddress,
    unresolvedComponents: 0,
    components: [],
    rate: rate,
  };

  return {
    tokenAddress: token.address,
    unresolvedComponents: 0,
    components: [component],
    rate: "1",
  };
}
