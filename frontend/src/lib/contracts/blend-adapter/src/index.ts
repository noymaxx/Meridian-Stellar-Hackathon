import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCUI5PWD4JRER3COUXUKKKKQ3VFNCM5DRAZVPTB2LV2AS4LHZ2PCI463",
  }
} as const

export enum RequestType {
  SupplyCollateral = 0,
  WithdrawCollateral = 1,
  Borrow = 4,
  Repay = 5,
}


export interface Request {
  address: string;
  amount: i128;
  request_type: RequestType;
}


export interface ReserveInfo {
  asset: string;
  c_factor: u32;
  enabled: boolean;
  l_factor: u32;
  max_util: u32;
  r_base: u32;
  r_one: u32;
  r_three: u32;
  r_two: u32;
  reactivity: u32;
  supply_cap: i128;
  util: u32;
}


export interface BlendPosition {
  collateral: Map<string, i128>;
  debt: Map<string, i128>;
  last_update: u64;
  pool: string;
  user: string;
}


export interface ComplianceResult {
  is_compliant: boolean;
  reason: string;
  required_actions: Array<string>;
}


export interface PoolInfo {
  created_at: u64;
  is_active: boolean;
  max_positions: u32;
  name: string;
  oracle: string;
  pool_address: string;
}


export interface TokenConfig {
  is_authorized: boolean;
  liq_threshold: u32;
  ltv_ratio: u32;
  pool_address: string;
  token_address: string;
}


export interface Position {
  borrowed: i128;
  can_borrow: boolean;
  collateral: i128;
  health_factor: u32;
  pool: string;
  user: string;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializar o contrato
   */
  initialize: ({admin}: {admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Criar pool simplificado
   */
  create_pool: ({admin, name, oracle, max_positions}: {admin: string, name: string, oracle: string, max_positions: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a register_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registrar pool existente - VERSÃO SIMPLES
   */
  register_pool: ({admin, pool_address, name, oracle, max_positions}: {admin: string, pool_address: string, name: string, oracle: string, max_positions: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_token_to_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adicionar token SRWA ao pool - VERSÃO SIMPLES
   */
  add_token_to_pool: ({admin, pool_address, token, ltv_ratio, liq_threshold}: {admin: string, pool_address: string, token: string, ltv_ratio: u32, liq_threshold: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a setup_pool_reserve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Setup Pool Reserve - VERSÃO SIMPLES SEM CROSS-CONTRACT CALL
   */
  setup_pool_reserve: ({admin, pool_address, asset}: {admin: string, pool_address: string, asset: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a supply_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Supply collateral SRWA - VERSÃO MOCK PARA TESTING
   */
  supply_collateral: ({from, pool_address, token, amount}: {from: string, pool_address: string, token: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a borrow_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Borrow amount - VERSÃO MOCK PARA TESTING
   */
  borrow_amount: ({from, pool_address, token, amount}: {from: string, pool_address: string, token: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a repay_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Repay amount - VERSÃO MOCK PARA TESTING
   */
  repay_amount: ({from, pool_address, token, amount}: {from: string, pool_address: string, token: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw collateral - VERSÃO MOCK PARA TESTING
   */
  withdraw_collateral: ({from, pool_address, token, amount}: {from: string, pool_address: string, token: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_position transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get posição do usuário
   */
  get_position: ({user, pool_address}: {user: string, pool_address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Position>>

  /**
   * Construct and simulate a get_all_pools transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get todos os pools
   */
  get_all_pools: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_pool_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get info do pool
   */
  get_pool_info: ({pool_address}: {pool_address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<PoolInfo>>

  /**
   * Construct and simulate a get_blend_position transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obter posição Blend do usuário
   */
  get_blend_position: ({user, pool_address}: {user: string, pool_address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<BlendPosition>>

  /**
   * Construct and simulate a add_reserve_to_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adicionar reserva ao pool Blend - VERSÃO SIMPLES
   */
  add_reserve_to_pool: ({admin, pool_address, asset, c_factor, l_factor, max_util, r_base, r_one}: {admin: string, pool_address: string, asset: string, c_factor: u32, l_factor: u32, max_util: u32, r_base: u32, r_one: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_reserve_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obter informações da reserva
   */
  get_reserve_info: ({pool_address, asset}: {pool_address: string, asset: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<ReserveInfo>>

  /**
   * Construct and simulate a get_pool_reserves transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obter todas as reservas do pool
   */
  get_pool_reserves: ({pool_address}: {pool_address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a check_operation_compliance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verificar compliance de uma operação - VERSÃO SIMPLES
   */
  check_operation_compliance: ({user, pool_address, token, amount, request_type}: {user: string, pool_address: string, token: string, amount: i128, request_type: RequestType}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<ComplianceResult>>

  /**
   * Construct and simulate a get_token_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get config do token
   */
  get_token_config: ({token}: {token: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<TokenConfig>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get admin
   */
  get_admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a pool_exists transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verificar se pool existe
   */
  pool_exists: ({pool_address}: {pool_address: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "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",
        "AAAAAAAAADxTZXR1cCBQb29sIFJlc2VydmUgLSBWRVJTw4NPIFNJTVBMRVMgU0VNIENST1NTLUNPTlRSQUNUIENBTEwAAAASc2V0dXBfcG9vbF9yZXNlcnZlAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAA=",
        "AAAAAAAAADJTdXBwbHkgY29sbGF0ZXJhbCBTUldBIC0gVkVSU8ODTyBNT0NLIFBBUkEgVEVTVElORwAAAAAAEXN1cHBseV9jb2xsYXRlcmFsAAAAAAAABAAAAAAAAAAEZnJvbQAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAClCb3Jyb3cgYW1vdW50IC0gVkVSU8ODTyBNT0NLIFBBUkEgVEVTVElORwAAAAAAAA1ib3Jyb3dfYW1vdW50AAAAAAAABAAAAAAAAAAEZnJvbQAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAChSZXBheSBhbW91bnQgLSBWRVJTw4NPIE1PQ0sgUEFSQSBURVNUSU5HAAAADHJlcGF5X2Ftb3VudAAAAAQAAAAAAAAABGZyb20AAAATAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAC9XaXRoZHJhdyBjb2xsYXRlcmFsIC0gVkVSU8ODTyBNT0NLIFBBUkEgVEVTVElORwAAAAATd2l0aGRyYXdfY29sbGF0ZXJhbAAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAABlHZXQgcG9zacOnw6NvIGRvIHVzdcOhcmlvAAAAAAAADGdldF9wb3NpdGlvbgAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAQAAB9AAAAAIUG9zaXRpb24=",
        "AAAAAAAAABJHZXQgdG9kb3Mgb3MgcG9vbHMAAAAAAA1nZXRfYWxsX3Bvb2xzAAAAAAAAAAAAAAEAAAPqAAAAEw==",
        "AAAAAAAAABBHZXQgaW5mbyBkbyBwb29sAAAADWdldF9wb29sX2luZm8AAAAAAAABAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAQAAB9AAAAAIUG9vbEluZm8=",
        "AAAAAAAAACFPYnRlciBwb3Npw6fDo28gQmxlbmQgZG8gdXN1w6FyaW8AAAAAAAASZ2V0X2JsZW5kX3Bvc2l0aW9uAAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAEAAAfQAAAADUJsZW5kUG9zaXRpb24AAAA=",
        "AAAAAAAAADFBZGljaW9uYXIgcmVzZXJ2YSBhbyBwb29sIEJsZW5kIC0gVkVSU8ODTyBTSU1QTEVTAAAAAAAAE2FkZF9yZXNlcnZlX3RvX3Bvb2wAAAAACAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAACGNfZmFjdG9yAAAABAAAAAAAAAAIbF9mYWN0b3IAAAAEAAAAAAAAAAhtYXhfdXRpbAAAAAQAAAAAAAAABnJfYmFzZQAAAAAABAAAAAAAAAAFcl9vbmUAAAAAAAAEAAAAAA==",
        "AAAAAAAAAB5PYnRlciBpbmZvcm1hw6fDtWVzIGRhIHJlc2VydmEAAAAAABBnZXRfcmVzZXJ2ZV9pbmZvAAAAAgAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAB9AAAAALUmVzZXJ2ZUluZm8A",
        "AAAAAAAAAB9PYnRlciB0b2RhcyBhcyByZXNlcnZhcyBkbyBwb29sAAAAABFnZXRfcG9vbF9yZXNlcnZlcwAAAAAAAAEAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAABAAAD6gAAABM=",
        "AAAAAAAAADhWZXJpZmljYXIgY29tcGxpYW5jZSBkZSB1bWEgb3BlcmHDp8OjbyAtIFZFUlPDg08gU0lNUExFUwAAABpjaGVja19vcGVyYXRpb25fY29tcGxpYW5jZQAAAAAABQAAAAAAAAAEdXNlcgAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAxyZXF1ZXN0X3R5cGUAAAfQAAAAC1JlcXVlc3RUeXBlAAAAAAEAAAfQAAAAEENvbXBsaWFuY2VSZXN1bHQ=",
        "AAAAAAAAABNHZXQgY29uZmlnIGRvIHRva2VuAAAAABBnZXRfdG9rZW5fY29uZmlnAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAB9AAAAALVG9rZW5Db25maWcA",
        "AAAAAAAAAAlHZXQgYWRtaW4AAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAABhWZXJpZmljYXIgc2UgcG9vbCBleGlzdGUAAAALcG9vbF9leGlzdHMAAAAAAQAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAEAAAAB" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        create_pool: this.txFromJSON<string>,
        register_pool: this.txFromJSON<null>,
        add_token_to_pool: this.txFromJSON<null>,
        setup_pool_reserve: this.txFromJSON<null>,
        supply_collateral: this.txFromJSON<null>,
        borrow_amount: this.txFromJSON<null>,
        repay_amount: this.txFromJSON<null>,
        withdraw_collateral: this.txFromJSON<null>,
        get_position: this.txFromJSON<Position>,
        get_all_pools: this.txFromJSON<Array<string>>,
        get_pool_info: this.txFromJSON<PoolInfo>,
        get_blend_position: this.txFromJSON<BlendPosition>,
        add_reserve_to_pool: this.txFromJSON<null>,
        get_reserve_info: this.txFromJSON<ReserveInfo>,
        get_pool_reserves: this.txFromJSON<Array<string>>,
        check_operation_compliance: this.txFromJSON<ComplianceResult>,
        get_token_config: this.txFromJSON<TokenConfig>,
        get_admin: this.txFromJSON<string>,
        pool_exists: this.txFromJSON<boolean>
  }
}