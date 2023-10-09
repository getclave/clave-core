/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { DataServiceWrapper } from '@redstone-finance/evm-connector/dist/src/wrappers/DataServiceWrapper';
import { CONSTANT_ADDRESSES, PAYMASTERABI } from 'clave-constants';
import { FString, abiCoder, derSignatureToRs, parseHex } from 'clave-utils';
import { constants, type ethers } from 'ethers';
import { EIP712Signer, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';
import { Contract } from 'zksync-web3';

import { DEFAULT_GAS_LIMIT, type IPopulatedTransaction } from './types';

export class PopulatedTransaction implements IPopulatedTransaction {
    transaction: types.TransactionRequest;
    private provider: Provider;
    private username: string;
    private messageSignerFn: (
        username: string,
        transaction: string,
    ) => Promise<string>;

    constructor(
        transaction: types.TransactionRequest,
        provider: Provider,
        username: string,
        messageSignerFn: (
            username: string,
            transaction: string,
        ) => Promise<string>,
    ) {
        this.transaction = transaction;
        this.provider = provider;
        this.username = username;
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

        const newTransaction = {
            ...this.transaction,
            customData: {
                ...this.transaction.customData,
                customSignature: formatSignature,
            },
        };

        this.transaction = newTransaction;
        return newTransaction;
    }

    public async attachPaymaster(
        paymasterAddress: string,
        tokenAddress: string,
    ): Promise<types.TransactionRequest> {
        const oraclePayload = await this.genOraclePayload(paymasterAddress);
        const paymasterParams = utils.getPaymasterParams(paymasterAddress, {
            type: 'ApprovalBased',
            token: tokenAddress,
            innerInput: oraclePayload,
            minimalAllowance: constants.Zero,
        });
        // if (tokenAddress == null) {
        //     paymasterParams = utils.getPaymasterParams(paymasterAddress, {
        //         type: 'General',
        //         innerInput: new Uint8Array(),
        //     });
        // } else {
        //     const oraclePayload = await this.genOraclePayload(paymasterAddress);
        //     paymasterParams = utils.getPaymasterParams(paymasterAddress, {
        //         type: 'ApprovalBased',
        //         token: tokenAddress,
        //         innerInput: oraclePayload,
        //         minimalAllowance: constants.Zero,
        //     });
        // }

        const newTransaction: types.TransactionRequest = {
            ...this.transaction,
            customData: {
                ...this.transaction.customData,
                paymasterParams,
            },
        };

        this.transaction = newTransaction;
        return newTransaction;
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
        this.transaction = transactionWithSignature;
        return await this.provider.sendTransaction(
            utils.serialize(transactionWithSignature),
        );
    }

    private async genOraclePayload(paymasterAddress: string): Promise<string> {
        const wrapper = new DataServiceWrapper({
            dataServiceId: 'redstone-primary-prod',
            dataFeeds: ['ETH'],
        });

        const paymasterContract = new Contract(
            paymasterAddress,
            PAYMASTERABI,
            this.provider,
        );

        const redstonePayload = await wrapper.getRedstonePayloadForManualUsage(
            paymasterContract,
        );
        return redstonePayload;
    }
}

export const getOraclePayload = async (
    paymasterContract: Contract,
): Promise<string> => {
    const wrapper = new DataServiceWrapper({
        dataServiceId: 'redstone-primary-prod',
        dataFeeds: ['ETH'],
    });
    const redstonePayload = await wrapper.getRedstonePayloadForManualUsage(
        paymasterContract,
    );
    return redstonePayload;
};
