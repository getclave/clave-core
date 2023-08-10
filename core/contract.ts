import { ethers } from 'ethers';
import { utils } from 'zksync-web3';
import type { types } from 'zksync-web3';

import { ClaveCore } from '.';
import { HexString, JsonFragment } from './types';

export class ClaveContract {
    private _contractAddress: HexString;
    private _contractABI: Array<JsonFragment>;
    private _claveBase: ClaveCore;

    constructor(
        contractAddress: HexString,
        abi: Array<JsonFragment>,
        claveBase: ClaveCore,
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
            await this._claveBase.genGetTransactionObject(
                this._contractAddress,
                value,
                calldata,
            );

        const signature = await this._claveBase.genSignTransaction(transaction);

        transaction = this._claveBase.addSignatureToTransaction(
            transaction,
            signature,
        );

        return this._claveBase._provider.sendTransaction(
            utils.serialize(transaction),
        );
    }

    public async read<Params extends Array<unknown>>(
        functionName: string,
        params: Params,
    ): Promise<unknown> {
        const contract = new ethers.Contract(
            this._contractAddress,
            this._contractABI,
            this._claveBase._provider,
        );

        return await contract[functionName](...params);
    }
}
