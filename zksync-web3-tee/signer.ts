import { Deferrable, defineReadOnly } from '@ethersproject/properties';
import { BigNumber, TypedDataDomain, TypedDataField, ethers } from 'ethers';
import {
    Contract,
    EIP712Signer,
    Provider,
    Wallet,
    types,
    utils,
} from 'zksync-web3';

import { ISigner } from './interfaces';

type FeeType = {
    gasPrice: BigNumber;
    gasLimit: BigNumber;
    feeToken: number;
    feeType: number;
    lastBaseFeePerGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
};

export class Signer implements ISigner {
    readonly _isSigner: boolean;
    public provider: Provider | undefined;
    public alias: string;
    public messageSignerFunction: (
        alias: string,
        hexMessage: string,
        prompt?: {
            usageMessage: string;
            androidTitle: string;
        },
    ) => Promise<string>;
    public publicAddress: string;

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
        this.alias = alias;
        this.messageSignerFunction = messageSignerFunction;
        if (ethers.utils.isAddress(publicAddress) === false)
            throw new Error('Invalid public address');
        this.publicAddress = publicAddress;
        this.provider = provider;

        defineReadOnly(this, '_isSigner', true);
    }

    connect(provider: Provider): Signer {
        return new Signer(
            this.alias,
            this.messageSignerFunction,
            this.publicAddress,
            provider,
        );
    }

    async getAddress(): Promise<string> {
        return this.publicAddress;
    }

    async getTransactionCount(): Promise<number> {
        if (!this.provider) throw new Error('Provider is not set');
        return await this.provider.getTransactionCount(this.publicAddress);
    }

    async populateCall(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest> {
        return this.populateCall(tx);
    }

    async populateTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest> {
        if (!this.provider) throw new Error('Provider is not set');
        if (tx.from !== this.publicAddress) tx.from = await this.getAddress();
        if (tx.to && ethers.utils.isAddress(tx.to) === false)
            throw new Error('Invalid sent address');
        if (tx.nonce == null) tx.nonce = await this.getTransactionCount();
        if (tx.value === null) tx.value = 0;
        if (!tx.data) tx.data = '0x';
        if (tx.gasLimit == null) tx.gasLimit = await this.estimateGas(tx);
        if (tx.chainId == null)
            tx.chainId = (await this.provider.getNetwork()).chainId;
        if (tx.type == null) tx.type = 113;
        if (tx.gasPrice == null)
            tx.gasPrice = await this.provider.getGasPrice();
        if (tx.customData?.gasPerPubdata == null)
            tx.customData = {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
            };
        return tx;
    }

    async estimateGas(tx: types.TransactionRequest): Promise<BigNumber> {
        if (!this.provider) throw new Error('Provider is not set');
        return await this.provider.estimateGas(tx);
    }

    async call(tx: types.TransactionRequest): Promise<string> {
        if (!this.provider) throw new Error('Provider is not set');
        return await this.provider.call(tx);
    }

    async resolveName(name: string): Promise<string> {
        return this.resolveName(name);
    }

    async signTransaction(tx: types.TransactionRequest): Promise<string> {
        const signedTxHash = EIP712Signer.getSignedDigest(tx);
        const signedTx = await this.messageSignerFunction(
            this.alias,
            signedTxHash.toString().slice(2),
        );
        return signedTx;
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        if (typeof message !== 'string') {
            message = new TextDecoder().decode(message);
        }
        const signedMessage: string = await this.messageSignerFunction(
            this.alias,
            message,
        );
        return signedMessage;
    }

    async signTypedData(
        domain: TypedDataDomain,
        types: Record<string, TypedDataField[]>,
        value: Record<string, any>,
    ): Promise<string> {
        return this.signTypedData(domain, types, value);
    }

    async sendTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionResponse> {
        if (!this.provider) throw new Error('Provider is not set');
        return this.provider.sendTransaction(utils.serialize(tx));
    }

    static isSigner(value: any): value is Signer {
        return !!(value && value._isSigner);
    }

    async getBalance(): Promise<BigNumber> {
        if (!this.provider) throw new Error('Provider is not set');
        return await this.provider.getBalance(this.publicAddress);
    }

    async getChainId(): Promise<number> {
        if (!this.provider) throw new Error('Provider is not set');
        return (await this.provider.getNetwork()).chainId;
    }
    async getGasPrice(): Promise<BigNumber> {
        return BigNumber.from(0);
    }

    async getFeeData(): Promise<FeeType> {
        return {
            gasPrice: await this.getGasPrice(),
            gasLimit: BigNumber.from(0),
            feeToken: 0,
            feeType: 0,
            lastBaseFeePerGas: BigNumber.from(0),
            maxFeePerGas: BigNumber.from(0),
            maxPriorityFeePerGas: BigNumber.from(0),
        };
    }

    checkTransaction(): Deferrable<types.TransactionRequest> {
        return {};
    }

    _checkProvider(): boolean {
        if (this.provider) return true;
        return false;
    }
}
