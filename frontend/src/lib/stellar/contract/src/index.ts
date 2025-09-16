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
    contractId: "CCT2DRUBLZV3I3H3JFEW64E4NMOSBCWMJCARM7SNC3WOBCNDWZ6FRQ7L",
  }
} as const

export enum RequestType {
  SupplyCollateral = 0,
  WithdrawCollateral = 1,
  SupplyLiability = 2,
  WithdrawLiability = 3,
  Borrow = 4,
  Repay = 5,
  FillUserLiquidationAuction = 6,
  FillBadDebtAuction = 7,
  FillInterestAuction = 8,
  DeleteLiquidationAuction = 9,
}


export interface Request {
  address: string;
  amount: i128;
  request_type: RequestType;
}


export interface PoolInfo {
  backstop_take_rate: u32;
  max_positions: u32;
  name: string;
  oracle: string;
  pool_address: string;
}


export interface UserPositionData {
  borrowed: Map<string, i128>;
  supplied: Map<string, i128>;
}


export interface ReserveConfig {
  c_factor: u32;
  decimals: u32;
  index: u32;
  l_factor: u32;
  max_util: u32;
  r_one: u32;
  r_three: u32;
  r_two: u32;
  reactivity: u32;
  util: u32;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the Blend adapter with official Blend V2 contracts
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
   * Construct and simulate a deploy_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deploy a new Blend lending pool using official pool factory
   */
  deploy_pool: ({admin, name, salt, oracle, backstop_take_rate, max_positions}: {admin: string, name: string, salt: Buffer, oracle: string, backstop_take_rate: u32, max_positions: u32}, options?: {
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
   * Construct and simulate a submit_requests transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit requests to Blend pool with proper validation
   */
  submit_requests: ({from, spender, to, pool_address, requests}: {from: string, spender: string, to: string, pool_address: string, requests: Array<Request>}, options?: {
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
   * Construct and simulate a supply_srwa_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Supply SRWA tokens as collateral to existing Blend pool
   */
  supply_srwa_collateral: ({from, pool_address, srwa_token, amount}: {from: string, pool_address: string, srwa_token: string, amount: i128}, options?: {
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
   * Construct and simulate a borrow_usdc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Borrow USDC against SRWA collateral
   */
  borrow_usdc: ({from, pool_address, amount}: {from: string, pool_address: string, amount: i128}, options?: {
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
   * Construct and simulate a repay_usdc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Repay USDC loan
   */
  repay_usdc: ({from, pool_address, amount}: {from: string, pool_address: string, amount: i128}, options?: {
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
   * Construct and simulate a withdraw_srwa_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw SRWA collateral
   */
  withdraw_srwa_collateral: ({from, pool_address, srwa_token, amount}: {from: string, pool_address: string, srwa_token: string, amount: i128}, options?: {
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
   * Construct and simulate a get_user_positions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get user positions in a Blend pool
   */
  get_user_positions: ({pool_address, user}: {pool_address: string, user: string}, options?: {
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
  }) => Promise<AssembledTransaction<UserPositionData>>

  /**
   * Construct and simulate a get_pool_factory transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get official contract addresses
   */
  get_pool_factory: (options?: {
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
   * Construct and simulate a get_backstop transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_backstop: (options?: {
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
   * Construct and simulate a get_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_oracle: (options?: {
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
   * Construct and simulate a get_usdc_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_usdc_token: (options?: {
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
   * Construct and simulate a get_xlm_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_xlm_token: (options?: {
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
   * Construct and simulate a get_blnd_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_blnd_token: (options?: {
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
   * Construct and simulate a get_pool_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get pool information
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
   * Construct and simulate a get_all_pools transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * List all pools managed by this adapter
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
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get admin address
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
   * Check if a pool exists in our registry
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

  /**
   * Construct and simulate a register_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register an existing Blend pool (if not deployed through this adapter)
   */
  register_pool: ({admin, pool_address, name, oracle, backstop_take_rate, max_positions}: {admin: string, pool_address: string, name: string, oracle: string, backstop_take_rate: u32, max_positions: u32}, options?: {
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
      new ContractSpec([ "AAAAAwAAAAAAAAAAAAAAC1JlcXVlc3RUeXBlAAAAAAoAAAAAAAAAEFN1cHBseUNvbGxhdGVyYWwAAAAAAAAAAAAAABJXaXRoZHJhd0NvbGxhdGVyYWwAAAAAAAEAAAAAAAAAD1N1cHBseUxpYWJpbGl0eQAAAAACAAAAAAAAABFXaXRoZHJhd0xpYWJpbGl0eQAAAAAAAAMAAAAAAAAABkJvcnJvdwAAAAAABAAAAAAAAAAFUmVwYXkAAAAAAAAFAAAAAAAAABpGaWxsVXNlckxpcXVpZGF0aW9uQXVjdGlvbgAAAAAABgAAAAAAAAASRmlsbEJhZERlYnRBdWN0aW9uAAAAAAAHAAAAAAAAABNGaWxsSW50ZXJlc3RBdWN0aW9uAAAAAAgAAAAAAAAAGERlbGV0ZUxpcXVpZGF0aW9uQXVjdGlvbgAAAAk=",
        "AAAAAQAAAAAAAAAAAAAAB1JlcXVlc3QAAAAAAwAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADHJlcXVlc3RfdHlwZQAAB9AAAAALUmVxdWVzdFR5cGUA",
        "AAAAAQAAAAAAAAAAAAAACFBvb2xJbmZvAAAABQAAAAAAAAASYmFja3N0b3BfdGFrZV9yYXRlAAAAAAAEAAAAAAAAAA1tYXhfcG9zaXRpb25zAAAAAAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAABm9yYWNsZQAAAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAAEFVzZXJQb3NpdGlvbkRhdGEAAAACAAAAAAAAAAhib3Jyb3dlZAAAA+wAAAATAAAACwAAAAAAAAAIc3VwcGxpZWQAAAPsAAAAEwAAAAs=",
        "AAAAAQAAAAAAAAAAAAAADVJlc2VydmVDb25maWcAAAAAAAAKAAAAAAAAAAhjX2ZhY3RvcgAAAAQAAAAAAAAACGRlY2ltYWxzAAAABAAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAhsX2ZhY3RvcgAAAAQAAAAAAAAACG1heF91dGlsAAAABAAAAAAAAAAFcl9vbmUAAAAAAAAEAAAAAAAAAAdyX3RocmVlAAAAAAQAAAAAAAAABXJfdHdvAAAAAAAABAAAAAAAAAAKcmVhY3Rpdml0eQAAAAAABAAAAAAAAAAEdXRpbAAAAAQ=",
        "AAAAAAAAAD1Jbml0aWFsaXplIHRoZSBCbGVuZCBhZGFwdGVyIHdpdGggb2ZmaWNpYWwgQmxlbmQgVjIgY29udHJhY3RzAAAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAADtEZXBsb3kgYSBuZXcgQmxlbmQgbGVuZGluZyBwb29sIHVzaW5nIG9mZmljaWFsIHBvb2wgZmFjdG9yeQAAAAALZGVwbG95X3Bvb2wAAAAABgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAEc2FsdAAAA+4AAAAgAAAAAAAAAAZvcmFjbGUAAAAAABMAAAAAAAAAEmJhY2tzdG9wX3Rha2VfcmF0ZQAAAAAABAAAAAAAAAANbWF4X3Bvc2l0aW9ucwAAAAAAAAQAAAABAAAAEw==",
        "AAAAAAAAADRTdWJtaXQgcmVxdWVzdHMgdG8gQmxlbmQgcG9vbCB3aXRoIHByb3BlciB2YWxpZGF0aW9uAAAAD3N1Ym1pdF9yZXF1ZXN0cwAAAAAFAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAAAAAAIcmVxdWVzdHMAAAPqAAAH0AAAAAdSZXF1ZXN0AAAAAAA=",
        "AAAAAAAAADdTdXBwbHkgU1JXQSB0b2tlbnMgYXMgY29sbGF0ZXJhbCB0byBleGlzdGluZyBCbGVuZCBwb29sAAAAABZzdXBwbHlfc3J3YV9jb2xsYXRlcmFsAAAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAAAAAAKc3J3YV90b2tlbgAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAACNCb3Jyb3cgVVNEQyBhZ2FpbnN0IFNSV0EgY29sbGF0ZXJhbAAAAAALYm9ycm93X3VzZGMAAAAAAwAAAAAAAAAEZnJvbQAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAA9SZXBheSBVU0RDIGxvYW4AAAAACnJlcGF5X3VzZGMAAAAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAABhXaXRoZHJhdyBTUldBIGNvbGxhdGVyYWwAAAAYd2l0aGRyYXdfc3J3YV9jb2xsYXRlcmFsAAAABAAAAAAAAAAEZnJvbQAAABMAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAAAAAAACnNyd2FfdG9rZW4AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAACJHZXQgdXNlciBwb3NpdGlvbnMgaW4gYSBCbGVuZCBwb29sAAAAAAASZ2V0X3VzZXJfcG9zaXRpb25zAAAAAAACAAAAAAAAAAxwb29sX2FkZHJlc3MAAAATAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAfQAAAAEFVzZXJQb3NpdGlvbkRhdGE=",
        "AAAAAAAAAB9HZXQgb2ZmaWNpYWwgY29udHJhY3QgYWRkcmVzc2VzAAAAABBnZXRfcG9vbF9mYWN0b3J5AAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAMZ2V0X2JhY2tzdG9wAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAKZ2V0X29yYWNsZQAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAOZ2V0X3VzZGNfdG9rZW4AAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAAAAAAANZ2V0X3hsbV90b2tlbgAAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAAAAAAAOZ2V0X2JsbmRfdG9rZW4AAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAABRHZXQgcG9vbCBpbmZvcm1hdGlvbgAAAA1nZXRfcG9vbF9pbmZvAAAAAAAAAQAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAEAAAfQAAAACFBvb2xJbmZv",
        "AAAAAAAAACZMaXN0IGFsbCBwb29scyBtYW5hZ2VkIGJ5IHRoaXMgYWRhcHRlcgAAAAAADWdldF9hbGxfcG9vbHMAAAAAAAAAAAAAAQAAA+oAAAAT",
        "AAAAAAAAABFHZXQgYWRtaW4gYWRkcmVzcwAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAACZDaGVjayBpZiBhIHBvb2wgZXhpc3RzIGluIG91ciByZWdpc3RyeQAAAAAAC3Bvb2xfZXhpc3RzAAAAAAEAAAAAAAAADHBvb2xfYWRkcmVzcwAAABMAAAABAAAAAQ==",
        "AAAAAAAAAEZSZWdpc3RlciBhbiBleGlzdGluZyBCbGVuZCBwb29sIChpZiBub3QgZGVwbG95ZWQgdGhyb3VnaCB0aGlzIGFkYXB0ZXIpAAAAAAANcmVnaXN0ZXJfcG9vbAAAAAAAAAYAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAMcG9vbF9hZGRyZXNzAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAABm9yYWNsZQAAAAAAEwAAAAAAAAASYmFja3N0b3BfdGFrZV9yYXRlAAAAAAAEAAAAAAAAAA1tYXhfcG9zaXRpb25zAAAAAAAABAAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
        deploy_pool: this.txFromJSON<string>,
        submit_requests: this.txFromJSON<null>,
        supply_srwa_collateral: this.txFromJSON<null>,
        borrow_usdc: this.txFromJSON<null>,
        repay_usdc: this.txFromJSON<null>,
        withdraw_srwa_collateral: this.txFromJSON<null>,
        get_user_positions: this.txFromJSON<UserPositionData>,
        get_pool_factory: this.txFromJSON<string>,
        get_backstop: this.txFromJSON<string>,
        get_oracle: this.txFromJSON<string>,
        get_usdc_token: this.txFromJSON<string>,
        get_xlm_token: this.txFromJSON<string>,
        get_blnd_token: this.txFromJSON<string>,
        get_pool_info: this.txFromJSON<PoolInfo>,
        get_all_pools: this.txFromJSON<Array<string>>,
        get_admin: this.txFromJSON<string>,
        pool_exists: this.txFromJSON<boolean>,
        register_pool: this.txFromJSON<null>
  }
}