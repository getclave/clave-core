import { ethers } from 'ethers';
import { EIP712Signer, utils } from 'zksync-web3';
import type { Provider, types } from 'zksync-web3';

import { ClaveContract } from '.';
import { HexString, JsonFragment } from './types';
import { setFatSignature } from './utils';

export class ClaveCore {
    _provider: Provider;
    _publicAddress: HexString;
    _username: string;
    _publicKey: HexString;
    _messageSignerFn: (
        _username: string,
        _transaction: string,
    ) => Promise<string>;
    constructor(
        provider: Provider,
        publicAddress: HexString,
        username: string,
        publicKey: HexString,
        messageSignerFn: (
            _username: string,
            _transaction: string,
        ) => Promise<string>,
    ) {
        this._provider = provider;
        this._publicAddress = publicAddress;
        this._username = username;
        this._publicKey = publicKey;
        this._messageSignerFn = messageSignerFn;
    }

    public async genGetTransactionObject(
        _to: HexString,
        _value = '0',
        _data = '0x',
        _gasLimit = 100000000,
        _customSignature?: string,
    ): Promise<types.TransactionRequest> {
        const gasPrice = await this._provider.getGasPrice();

        const transaction: types.TransactionRequest = {
            data: _data,
            to: _to,
            from: this._publicAddress,
            value: ethers.utils.parseEther(_value),
            chainId: (await this._provider.getNetwork()).chainId,
            gasLimit: _gasLimit,
            nonce: await this._provider.getTransactionCount(
                this._publicAddress,
            ),
            type: 113,
            gasPrice: gasPrice,
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                customSignature: _customSignature,
            } as types.Eip712Meta,
        };

        return transaction;
    }

    public addSignatureToTransaction(
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

    public async genSignTransaction(
        _transaction: types.TransactionRequest,
    ): Promise<string> {
        const signedTxHash = EIP712Signer.getSignedDigest(_transaction);

        const signature = await this._messageSignerFn(
            this._username,
            signedTxHash.toString().slice(2),
        );
        const fatSignature = await setFatSignature(signature, this._publicKey);
        return fatSignature;
    }

    public async genTransferTransaction(
        _to: HexString,
        _value: string,
    ): Promise<types.TransactionResponse> {
        let transaction: types.TransactionRequest =
            await this.genGetTransactionObject(_to, _value);

        const signature = await this.genSignTransaction(transaction);

        transaction = this.addSignatureToTransaction(transaction, signature);

        return this._provider.sendTransaction(utils.serialize(transaction));
    }

    public async transfer(
        _to: HexString,
        _value: string,
    ): Promise<types.TransactionResponse> {
        return await this.genTransferTransaction(_to, _value);
    }

    public Contract(
        contractAddress: HexString,
        abi: Array<JsonFragment>,
    ): ClaveContract {
        return new ClaveContract(contractAddress, abi, this);
    }
}
