import { Deferrable } from '@ethersproject/properties';
import { BigNumber, TypedDataDomain, TypedDataField, ethers } from 'ethers';
import { EIP712Signer, Provider, types, utils } from 'zksync-web3';

import { FeeType, ISigner } from './interfaces/ISigner';
import { getFatSignature } from './utils';

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
    public publicKey: string;
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
        publicKey: string,
        provider: Provider | undefined,
    ) {
        // defineReadOnly(this, '_isSigner', true);
        this._isSigner = true;
        this.alias = alias;
        this.messageSignerFunction = messageSignerFunction;
        if (ethers.utils.isAddress(publicAddress) === false)
            throw new Error('Invalid public address');
        this.publicAddress = publicAddress;
        this.publicKey = publicKey;
        this.provider = provider;
    }

    connect(provider: Provider): Signer {
        return new Signer(
            this.alias,
            this.messageSignerFunction,
            this.publicAddress,
            this.publicKey,
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
        tx.from = await this.getAddress();
        if (tx.to && ethers.utils.isAddress(tx.to) === false)
            throw new Error('Invalid sent address');
        if (tx.nonce == null) tx.nonce = await this.getTransactionCount();
        if (!tx.value) tx.value = ethers.utils.parseEther('0');
        if (tx.data == null) tx.data = '0x';
        if (tx.gasLimit == null) tx.gasLimit = 100000000;
        // if (tx.gasLimit == null) tx.gasLimit = await this.estimateGas(tx);
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
        const signature = await getFatSignature(signedTx, this.publicKey);

        return signature;
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        if (typeof message !== 'string') {
            message = String.fromCharCode(...Array.from(message));
        }
        const signedMessage: string = await this.messageSignerFunction(
            this.alias,
            message,
        );
        const signature = await getFatSignature(signedMessage, this.publicKey);
        return signature;
    }

    async signTypedData(
        domain: TypedDataDomain,
        types: Record<string, Array<TypedDataField>>,
        // eslint-disable-next-line
        value: Record<string, any>,
    ): Promise<string> {
        return this.signTypedData(domain, types, value);
    }

    async sendTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionResponse> {
        if (!this.provider) throw new Error('Provider is not set');
        const transaction = await this.populateTransaction(tx);
        const signedTransaction = await this.signTransaction(transaction);
        const addedSignature = {
            ...transaction,
            customData: {
                ...transaction.customData,
                customSignature: signedTransaction,
            },
        };
        return this.provider.sendTransaction(utils.serialize(addedSignature));
    }
    // eslint-disable-next-line
    isSigner(value: any): value is any {
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
