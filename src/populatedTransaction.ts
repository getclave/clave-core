/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { CONSTANT_ADDRESSES } from 'clave-constants';
import {
    abiCoder,
    derSignatureToRs,
    getFatSignature,
    parseHex,
} from 'clave-utils';
import { type ethers } from 'ethers';
import { EIP712Signer, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import type { IPopulatedTransaction } from './types';

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

    public attachSignature(
        transaction: types.TransactionRequest,
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
            ...transaction,
            customData: {
                ...transaction.customData,
                customSignature: formatSignature,
            },
        };
    }

    public async signTransaction(
        _transaction: types.TransactionRequest,
    ): Promise<string> {
        const signedTxHash = EIP712Signer.getSignedDigest(_transaction);

        const signature = await this.messageSignerFn(
            this.username,
            parseHex(signedTxHash.toString()),
        );
        const { r, s } = derSignatureToRs(signature);
        // const fatSignature = await getFatSignature(
        //     r._hex + s._hex.slice(2),
        //     this.publicKey,
        // );
        console.log((r._hex + s._hex.slice(2)).length);
        return r._hex + s._hex.slice(2);
    }

    async send(
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        const signature = await this.signTransaction(this.transaction);
        const transactionWithSignature = this.attachSignature(
            this.transaction,
            signature,
            validatorAddress,
            hookData,
        );
        return await this.provider.sendTransaction(
            utils.serialize(transactionWithSignature),
        );
    }
}
