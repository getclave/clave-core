/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import type { BigNumber, providers, utils } from 'ethers';
import type { Provider, types } from 'zksync-web3';

export interface ICore {
    provider: Provider;
    populateTransaction(
        to: string,
        value?: string,
        data?: string,
        gasLimit?: number,
        customSignature?: string,
    ): Promise<IPopulatedTransaction>;
    sendTransaction(
        to: string,
        value: string,
        data?: string,
        validatorAddress?: string,
        hookData?: Array<Buffer>,
    ): Promise<TransactionResponse>;
    transfer(
        to: string,
        value: string,
        validatorAddress?: string,
        hookData?: Array<Buffer>,
    ): Promise<TransactionResponse>;
    Contract(
        contractAddress: string,
        abi: Array<JsonFragment | string>,
    ): IContract;
    getBalancesWithMultiCall3(
        tokenAddresses: Array<string>,
    ): Promise<Array<BigNumber>>;
}

export interface IContract {
    write<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
        value: string,
    ): Promise<types.TransactionResponse>;
    read<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
    ): Promise<unknown>;
}

export interface JsonFragmentType {
    readonly name?: string;
    readonly indexed?: boolean;
    readonly type?: string;
    // eslint-disable-next-line
    readonly internalType?: any;
    readonly components?: ReadonlyArray<JsonFragmentType>;
}
export interface JsonFragment {
    readonly name?: string;
    readonly type?: string;

    readonly anonymous?: boolean;

    readonly payable?: boolean;
    readonly constant?: boolean;
    readonly stateMutability?: string;

    readonly inputs?: ReadonlyArray<JsonFragmentType>;
    readonly outputs?: ReadonlyArray<JsonFragmentType>;

    readonly gas?: string;
}

export interface TransactionResponse extends providers.TransactionResponse {
    l1BatchNumber: number;
    l1BatchTxIndex: number;
    waitFinalize(): Promise<TransactionReceipt>;
}

export interface TransactionReceipt extends providers.TransactionReceipt {
    l1BatchNumber: number;
    l1BatchTxIndex: number;
    logs: Array<Log>;
    l2ToL1Logs: Array<L2ToL1Log>;
}

export interface Log extends providers.Log {
    l1BatchNumber: number;
}
export interface L2ToL1Log {
    blockNumber: number;
    blockHash: string;
    l1BatchNumber: number;
    transactionIndex: number;
    shardId: number;
    isService: boolean;
    sender: string;
    key: string;
    value: string;
    transactionHash: string;
    logIndex: number;
}

export const DEFAULT_GAS_LIMIT = 100000000;

export type Aggregate3Response = { success: boolean; returnData: string };

export interface IPopulatedTransaction {
    transaction: types.TransactionRequest;
    attachSignature(
        transaction: types.TransactionRequest,
        signature: string,
        validatorAddress?: string,
        hookData?: Array<utils.BytesLike>,
    ): types.TransactionRequest;

    signTransaction(transaction: types.TransactionRequest): Promise<string>;

    send(
        validatorAddress?: string,
        hookData?: Array<utils.BytesLike>,
    ): Promise<types.TransactionResponse>;
}
