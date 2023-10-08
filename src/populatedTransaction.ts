/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { CONSTANT_ADDRESSES } from 'clave-constants';
import { FString, abiCoder, derSignatureToRs, parseHex } from 'clave-utils';
import { type ethers } from 'ethers';
import { EIP712Signer, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { DEFAULT_GAS_LIMIT, type IPopulatedTransaction } from './types';

export class PopulatedTransaction implements IPopulatedTransaction {
    transaction: types.TransactionRequest;
    private provider: Provider;
    private username: string;
    private publicKey: string;
    private messageSignerFn: (
        username: string,
        transaction: string,
    ) => Promise<string>;

    constructor(
        transaction: types.TransactionRequest,
        provider: Provider,
        username: string,
        publicKey: string,
        messageSignerFn: (
            username: string,
            transaction: string,
        ) => Promise<string>,
    ) {
        this.transaction = transaction;
        this.provider = provider;
        this.username = username;
        this.publicKey = publicKey;
        this.messageSignerFn = messageSignerFn;
    }

    public getProvider(): Provider {
        return this.provider;
    }

    public attachSignature(
        signature: string,
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): types.TransactionRequest {
        const formatSignature = abiCoder.encode(
            ['bytes', 'address', 'bytes[]'],
            [signature, validatorAddress, hookData],
        );
        console.log(formatSignature.length);
        return {
            ...this.transaction,
            customData: {
                ...this.transaction.customData,
                customSignature: formatSignature,
            },
        };
    }

    public async signTransaction(): Promise<string> {
        const signedTxHash = EIP712Signer.getSignedDigest(this.transaction);

        const signature = await this.messageSignerFn(
            this.username,
            parseHex(signedTxHash.toString()),
        );
        const { r, s } = derSignatureToRs(signature);
        return FString.concat(r._hex, FString.parseHex(s._hex));
    }

    public async estimateFee(): Promise<number> {
        try {
            return (
                await this.provider.estimateGas(this.transaction)
            ).toNumber();
        } catch {
            return DEFAULT_GAS_LIMIT;
        }
    }

    async send(
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        const signature = await this.signTransaction();
        const transactionWithSignature = this.attachSignature(
            signature,
            validatorAddress,
            hookData,
        );
        return await this.provider.sendTransaction(
            utils.serialize(transactionWithSignature),
        );
    }
}
