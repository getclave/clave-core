import { ethers } from 'ethers';
import { providers } from 'ethers';
import { Provider, types } from 'zksync-web3';

import { HexString } from './HexString.types';

interface IZkSyncContract {
    _provider: Provider;
    _contractAddress?: HexString;
    _abi?: Array<JsonFragment>;
    _abiCoder: ethers.utils.AbiCoder;

    genZkSyncTransfer(
        _from: HexString,
        _to: HexString,
        _value: string,
        _username: string,
        _publicKey: string,
        messageSignerFn: (
            _username: string,
            _transaction: string,
        ) => Promise<string>,
    ): Promise<types.TransactionResponse>;

    genZkSyncTransaction<Params extends Array<unknown>>(
        _from: HexString,
        _value: string,
        _username: string,
        _publicKey: string,
        _functionName: string,
        _params: Params,
        messageSignerFn: (
            _username: string,
            _transaction: string,
        ) => Promise<string>,
    ): Promise<types.TransactionResponse>;
}

export interface JsonFragmentType {
    readonly name?: string;
    readonly indexed?: boolean;
    readonly type?: string;
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
