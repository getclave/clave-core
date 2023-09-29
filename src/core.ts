/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { CONSTANT_ADDRESSES, ERC20ABI, MULTICALL3_ABI } from 'clave-constants';
import { BigNumber, ethers } from 'ethers';
import { Contract as ZksyncContract, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { Contract } from '.';
import { PopulatedTransaction } from './populatedTransaction';
import type { Aggregate3Response, JsonFragment } from './types';
import { DEFAULT_GAS_LIMIT } from './types';

export class Core {
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
        const populatedTransaction = new PopulatedTransaction(
            { ...transaction, gasLimit },
            this.provider,
            this._username,
            this._publicKey,
            this._messageSignerFn,
        );

        return populatedTransaction;
    }

    public async sendTransaction(
        to: string,
        value: string,
        data = '0x',
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        const transaction = await this.populateTransaction(to, value, data);

        return await transaction.send(validatorAddress, hookData);
    }

    public async transfer(
        to: string,
        value: string,
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
