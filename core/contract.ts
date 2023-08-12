import { ethers } from 'ethers';
import { utils } from 'zksync-web3';
import type { types } from 'zksync-web3';

import type { Core } from '.';
import type { HexString, IContract, JsonFragment } from './types';

export class Contract implements IContract {
    private _contractAddress: HexString;
    private _contractABI: Array<JsonFragment>;
    private _claveBase: Core;

    constructor(
        contractAddress: HexString,
        abi: Array<JsonFragment>,
        claveBase: Core,
    ) {
        this._contractAddress = contractAddress;
        this._contractABI = abi;
        this._claveBase = claveBase;
    }

    private _getExecutionCallData<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
    ): HexString {
        const iface = new ethers.utils.Interface(this._contractABI);
        const calldata = iface.encodeFunctionData(functionName, params);

        return calldata as HexString;
    }

    public async write<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
        value: string,
    ): Promise<types.TransactionResponse> {
        const calldata = this._getExecutionCallData(functionName, params);
        let transaction: types.TransactionRequest =
            await this._claveBase.populateTransaction(
                this._contractAddress,
                value,
                calldata,
            );

        const signature = await this._claveBase.signTransaction(transaction);

        transaction = this._claveBase.attachSignature(transaction, signature);

        return this._claveBase.provider.sendTransaction(
            utils.serialize(transaction),
        );
    }

    public async read<Params extends Array<unknown>, ReturnType = unknown>(
        functionName: string,
        params: Params,
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
