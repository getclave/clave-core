/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import {
    CONSTANT_ADDRESSES,
    ERC20ABI,
    MULTICALL3_ABI,
} from '@getclave/constants';
import { BigNumber, ethers } from 'ethers';
import { Contract as ZksyncContract, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { Contract } from '.';
import { PopulatedTransaction, estimateGas } from './populatedTransaction';
import type { Aggregate3Response, ICore, JsonFragment } from './types';
import { DEFAULT_GAS_LIMIT } from './types';

export class Core implements ICore {
    provider: Provider;
    private _publicAddress: string;
    private _username: string;
    private _messageSignerFn: (
        username: string,
        transaction: string,
    ) => Promise<string>;

    constructor(
        provider: Provider,
        publicAddress: string,
        username: string,
        messageSignerFn: (
            _username: string,
            _transaction: string,
        ) => Promise<string>,
    ) {
        this.provider = provider;
        this._publicAddress = publicAddress;
        this._username = username;
        this._messageSignerFn = messageSignerFn;
    }

    public async estimateGas(
        transaction: types.TransactionRequest,
    ): Promise<number> {
        return await estimateGas(this.provider, transaction);
    }

    public async populateTransaction(
        to: string,
        value = BigNumber.from(0),
        data = '0x',
        gasLimit = DEFAULT_GAS_LIMIT,
        customSignature?: string,
    ): Promise<PopulatedTransaction> {
        const gasPrice = await this.provider.getGasPrice();
        const chainId = (await this.provider.getNetwork()).chainId;
        const nonce = await this.provider.getTransactionCount(
            this._publicAddress,
        );

        const transaction: types.TransactionRequest = {
            data,
            to,
            from: this._publicAddress,
            value,
            chainId,
            nonce,
            type: 113,
            gasPrice,
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                customSignature,
            },
        };

        gasLimit = await this.estimateGas(transaction);

        const populatedTransaction = new PopulatedTransaction(
            { ...transaction, gasLimit },
            this.provider,
            this._username,
            this._messageSignerFn,
        );

        return populatedTransaction;
    }

    public async sendTransaction(
        to: string,
        value: BigNumber,
        data = '0x',
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        const transaction = await this.populateTransaction(to, value, data);

        return await transaction.send(validatorAddress, hookData);
    }

    public async transfer(
        to: string,
        value: BigNumber,
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        return this.sendTransaction(
            to,
            value,
            '0x',
            validatorAddress,
            hookData,
        );
    }

    public Contract(
        contractAddress: string,
        abi: Array<JsonFragment | string>,
    ): Contract {
        return new Contract(contractAddress, abi, this);
    }

    public async getBalancesWithMultiCall3(
        tokenAddresses: Array<string>,
    ): Promise<Array<BigNumber>> {
        const ETH_ADDRESS = '0x000000000000000000000000000000000000800A';
        const multicall3Contract = new ZksyncContract(
            CONSTANT_ADDRESSES.MULTICALL3,
            MULTICALL3_ABI,
            this.provider,
        );
        const erc20TokenInterface = new ethers.utils.Interface(ERC20ABI);

        const calls = tokenAddresses.map((addr) => {
            let calldata = erc20TokenInterface.encodeFunctionData('balanceOf', [
                this._publicAddress,
            ]);
            if (addr === ETH_ADDRESS) {
                // selector of balanceOf(uint256) instead of balanceOf(address)
                calldata = '0x9cc7f708'.concat(calldata.slice(10));
            }
            return [
                addr, // target
                true, // allowFailure
                calldata, //calldata
            ];
        });
        const results: Array<Aggregate3Response> =
            await multicall3Contract.callStatic.aggregate3(calls);

        const tokenBalances: Array<BigNumber> = results.map((result) => {
            if (result.success === false) return BigNumber.from(0);
            return BigNumber.from(result.returnData);
        });

        return tokenBalances;
    }
}
