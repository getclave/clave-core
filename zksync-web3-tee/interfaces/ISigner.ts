import type {
    TypedDataDomain,
    TypedDataField,
} from '@ethersproject/abstract-signer';
import type { Deferrable } from '@ethersproject/properties';
import type { BigNumber } from 'ethers';
import type { Provider, types } from 'zksync-web3';

export interface ISigner {
    _isSigner: boolean;
    provider: Provider | undefined;
    alias: string;
    messageSignerFunction: (
        alias: string,
        hexMessage: string,
        prompt?: {
            usageMessage: string;
            androidTitle: string;
        },
    ) => Promise<string>;
    publicAddress: string;
    publicKey: string;
    // eslint-disable-next-line
    connect(provider: Provider): any;
    getAddress(): Promise<string>;
    getTransactionCount(): Promise<number>;
    populateCall(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest>;
    populateTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest>;
    estimateGas(tx: types.TransactionRequest): Promise<BigNumber>;
    call(tx: types.TransactionRequest): Promise<string>;
    resolveName(name: string): Promise<string>;
    signTransaction(tx: types.TransactionRequest): Promise<string>;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTypedData(
        domain: TypedDataDomain,
        types: Record<string, Array<TypedDataField>>,
        // eslint-disable-next-line
        value: Record<string, any>,
    ): Promise<string>;
    sendTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionResponse>;
    // eslint-disable-next-line
    isSigner(value: any): value is any;
    getBalance(): Promise<BigNumber>;
    getChainId(): Promise<number>;
    getGasPrice(): Promise<BigNumber>;
    checkTransaction(
        transaction: Deferrable<types.TransactionRequest>,
    ): Deferrable<types.TransactionRequest>;
    _checkProvider(operation?: string): void;
}

export const allowedTransactionKeys: Array<string> = [
    'accessList',
    'ccipReadEnabled',
    'chainId',
    'customData',
    'data',
    'from',
    'gasLimit',
    'gasPrice',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
    'nonce',
    'to',
    'type',
    'value',
];
