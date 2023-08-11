import {
    TypedDataDomain,
    TypedDataField,
} from '@ethersproject/abstract-signer';
import { Deferrable } from '@ethersproject/properties';
import { BigNumber } from 'ethers';
import { Provider, types } from 'zksync-web3';

export type FeeType = {
    gasPrice: BigNumber;
    gasLimit: BigNumber;
    feeToken: number;
    feeType: number;
    lastBaseFeePerGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
};
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
    getFeeData(): Promise<FeeType>;
    checkTransaction(): Deferrable<types.TransactionRequest>;
    _checkProvider(): boolean;
}
