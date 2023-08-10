import { BigNumber } from 'ethers';
import { Provider, types } from 'zksync-web3';

import { BaseWallet } from './interfaces/index';

export class Wallet extends BaseWallet {
    constructor(
        alias: string,
        messageSignerFunction: (
            alias: string,
            hexMessage: string,
            prompt?: {
                usageMessage: string;
                androidTitle: string;
            },
        ) => Promise<string>,
        publicAddress: string,
        provider: Provider | undefined,
    ) {
        super(alias, messageSignerFunction, publicAddress, provider);
    }
    async getAddress(): Promise<string> {
        return super.getAddress();
    }

    async getTransactionCount(): Promise<number> {
        return super.getTransactionCount();
    }

    async estimateGas(tx: types.TransactionRequest): Promise<BigNumber> {
        return await super.estimateGas(tx);
    }

    async call(tx: types.TransactionRequest): Promise<string> {
        return await super.call(tx);
    }

    async signTransaction(tx: types.TransactionRequest): Promise<string> {
        return await super.signTransaction(tx);
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        return await super.signMessage(message);
    }

    async sendTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionResponse> {
        return await super.sendTransaction(tx);
    }

    async populateTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest> {
        return await super.populateTransaction(tx);
    }

    async getBalance(): Promise<BigNumber> {
        return await super.getBalance();
    }

    async getChainId(): Promise<number> {
        return await super.getChainId();
    }
}
