/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { ethers } from 'ethers';
import { utils } from 'zksync-web3';
import type { types } from 'zksync-web3';

import type { Core } from '.';
import { CONSTANT_ADDRESSES } from '../../clave-constants/address/index';
import type { IContract, JsonFragment } from './types';

export class Contract implements IContract {
    private _contractAddress: string;
    private _contractABI: Array<JsonFragment | string>;
    private _claveBase: Core;

    constructor(
        contractAddress: string,
        abi: Array<JsonFragment | string>,
        claveBase: Core,
    ) {
        this._contractAddress = contractAddress;
        this._contractABI = abi;
        this._claveBase = claveBase;
    }

    private _getExecutionCallData<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
    ): string {
        const iface = new ethers.utils.Interface(this._contractABI);
        const calldata = iface.encodeFunctionData(functionName, params);

        return calldata;
    }

    public async write<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
        value = '0',
        validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS,
        hookData: Array<ethers.utils.BytesLike> = [],
    ): Promise<types.TransactionResponse> {
        const calldata = this._getExecutionCallData(functionName, params);

        return this._claveBase.sendTransaction(
            this._contractAddress,
            value,
            calldata,
            validatorAddress,
            hookData,
        );
    }

    public async read<Params extends Array<unknown> = [], ReturnType = unknown>(
        functionName: string,
        ...params: Params
    ): Promise<ReturnType> {
        const contract = new ethers.Contract(
            this._contractAddress,
            this._contractABI,
            this._claveBase.provider,
        );

        const result = await contract[functionName](...params);
        return result as ReturnType;
    }
}
