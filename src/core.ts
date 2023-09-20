/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { CONSTANT_ADDRESSES, MULTICALL3_ABI } from 'clave-constants';
import { getFatSignature } from 'clave-utils';
import { ethers } from 'ethers';
import { EIP712Signer, Contract as ZkSyncContract, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { Contract } from '.';
import type { ICore, JsonFragment } from './types';
import { DEFAULT_GAS_LIMIT } from './types';

export class Core implements ICore {
    provider: Provider;
    private _publicAddress: string;
    private _username: string;
    private _publicKey: string;
    private _messageSignerFn: (
        username: string,
        transaction: string,
    ) => Promise<string>;
    constructor(
        provider: Provider,
        publicAddress: string,
        username: string,
        publicKey: string,
        messageSignerFn: (
            _username: string,
            _transaction: string,
        ) => Promise<string>,
    ) {
        this.provider = provider;
        this._publicAddress = publicAddress;
        this._username = username;
        this._publicKey = publicKey;
        this._messageSignerFn = messageSignerFn;
    }

    public async populateTransaction(
        to: string,
        value = '0',
        data = '0x',
        gasLimit = DEFAULT_GAS_LIMIT,
        customSignature?: string,
    ): Promise<types.TransactionRequest> {
        const gasPrice = await this.provider.getGasPrice();
        const chainId = (await this.provider.getNetwork()).chainId;
        const nonce = await this.provider.getTransactionCount(
            this._publicAddress,
        );

        const transaction: types.TransactionRequest = {
            data,
            to,
            from: this._publicAddress,
            value: ethers.utils.parseEther(value),
            chainId,
            nonce,
            type: 113,
            gasPrice,
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                customSignature,
            },
        };

        if (gasLimit === DEFAULT_GAS_LIMIT) {
            gasLimit = (
                await this.provider.estimateGas(transaction)
            ).toNumber();
        }

        return { ...transaction, gasLimit };
    }

    public attachSignature(
        transaction: types.TransactionRequest,
        signature: string,
    ): types.TransactionRequest {
        return {
            ...transaction,
            customData: {
                ...transaction.customData,
                customSignature: signature,
            },
        };
    }

    public async signTransaction(
        _transaction: types.TransactionRequest,
    ): Promise<string> {
        const signedTxHash = EIP712Signer.getSignedDigest(_transaction);

        const signature = await this._messageSignerFn(
            this._username,
            signedTxHash.toString().slice(2),
        );
        const fatSignature = await getFatSignature(signature, this._publicKey);
        return fatSignature;
    }

    public async transfer(
        _to: string,
        _value: string,
    ): Promise<types.TransactionResponse> {
        let transaction: types.TransactionRequest =
            await this.populateTransaction(_to, _value);

        const signature = await this.signTransaction(transaction);

        transaction = this.attachSignature(transaction, signature);

        return this.provider.sendTransaction(utils.serialize(transaction));
    }

    public Contract(
        contractAddress: string,
        abi: Array<JsonFragment>,
    ): Contract {
        return new Contract(contractAddress, abi, this);
    }

    public getBalancesWithMultiCall3(): ZkSyncContract {
        const multicall3Contract = this.Contract(
            CONSTANT_ADDRESSES.MULTICALL3,
            MULTICALL3_ABI,
        );
        return new ZkSyncContract(
            CONSTANT_ADDRESSES.MULTICALL3,
            MULTICALL3_ABI,
            this.provider,
        );
    }
}
