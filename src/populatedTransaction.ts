/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { DataServiceWrapper } from '@redstone-finance/evm-connector/dist/src/wrappers/DataServiceWrapper';
import { CONSTANT_ADDRESSES, PAYMASTERABI } from 'clave-constants';
import { FString, abiCoder, derSignatureToRs } from 'clave-utils';
import { type ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
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
        tokenAddress?: string,
    ): Promise<types.TransactionRequest> {
        let paymasterParams;

        // gasless paymaster
        if (tokenAddress == null) {
            paymasterParams = utils.getPaymasterParams(paymasterAddress, {
                type: 'General',
                innerInput: new Uint8Array(),
            });
        } else {
            // erc20 paymaster
            const oraclePayload = await this.genOraclePayload(paymasterAddress);
            paymasterParams = utils.getPaymasterParams(paymasterAddress, {
                type: 'ApprovalBased',
                token: tokenAddress,
                innerInput: oraclePayload,
                minimalAllowance: parseUnits('50', 18),
            });
        }

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
            FString.parseHex(signedTxHash.toString()),
        );
        const { r, s } = derSignatureToRs(signature);
        return FString.concat(r._hex, FString.parseHex(s._hex));
    }

    public async estimateFee(): Promise<number> {
        try {
            return await estimateGas(this.provider, this.transaction);
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

export const estimateGas = async (
    provider: Provider,
    transaction: types.TransactionRequest,
): Promise<number> => {
    const EXTRA_GAS = 1_500_000;
    try {
        const estimatedGas = (
            await provider.estimateGas(transaction)
        ).toNumber();
        return estimatedGas + EXTRA_GAS;
    } catch (e) {
        return DEFAULT_GAS_LIMIT;
    }
};
