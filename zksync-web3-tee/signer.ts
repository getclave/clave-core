import type { Deferrable } from '@ethersproject/properties';
import { getFatSignature } from 'clave-utils';
import type { TypedDataDomain, TypedDataField } from 'ethers';
import { BigNumber, ethers } from 'ethers';
import { EIP712Signer, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { allowedTransactionKeys } from './interfaces/ISigner';
import type { ISigner } from './interfaces/ISigner';

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
        this._checkProvider('getTransactionCount');
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
        this._checkProvider('populateTransaction');

        const { provider } = this;

        tx.from = await this.getAddress();

        if (tx.to && !ethers.utils.isAddress(tx.to))
            throw new Error('Invalid sent address');

        tx.nonce ??= await this.getTransactionCount();
        tx.value ??= ethers.utils.parseEther('0');
        tx.data ??= '0x';
        tx.gasLimit ??= await this.estimateGas(tx);
        tx.chainId ??= (await provider.getNetwork()).chainId;
        tx.type ??= 113;
        tx.gasPrice ??= await provider.getGasPrice();

        tx.customData ??= {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        };

        return tx;
    }

    async estimateGas(tx: types.TransactionRequest): Promise<BigNumber> {
        this._checkProvider('estimateGas');
        return await this.provider.estimateGas(tx);
    }

    async call(tx: types.TransactionRequest): Promise<string> {
        this._checkProvider('call');
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
        this._checkProvider('sendTransaction');
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
    isSigner(value: any): value is Signer {
        return !!(value && value._isSigner);
    }

    async getBalance(): Promise<BigNumber> {
        this._checkProvider('getBalance');
        return await this.provider.getBalance(this.publicAddress);
    }

    async getChainId(): Promise<number> {
        this._checkProvider('getChainId');
        return (await this.provider.getNetwork()).chainId;
    }
    async getGasPrice(): Promise<BigNumber> {
        return BigNumber.from(0);
    }

    checkTransaction(
        transaction: Deferrable<types.TransactionRequest>,
    ): Deferrable<types.TransactionRequest> {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                throw new Error('invalid transaction key: '.concat(key));
            }
        }

        if (transaction.from == null) {
            transaction.from = this.getAddress();
        } else {
            // Make sure any provided address matches this signer
            if (transaction.from !== this.getAddress()) {
                throw new Error('from address mismatch');
            }
        }

        return transaction;
    }

    _checkProvider(operation?: string): asserts this is { provider: Provider } {
        if (!this.provider) {
            throw new Error(`Provider is not set when calling ${operation}`);
        }
    }
}
