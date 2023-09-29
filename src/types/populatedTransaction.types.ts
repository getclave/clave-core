/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
import { type utils } from 'ethers';
import type { types } from 'zksync-web3';

export interface IPopulatedTransaction {
    transaction: types.TransactionRequest;
    attachSignature(
        transaction: types.TransactionRequest,
        signature: string,
        validatorAddress?: string,
        hookData?: Array<utils.BytesLike>,
    ): types.TransactionRequest;

    signTransaction(transaction: types.TransactionRequest): Promise<string>;

    send(
        validatorAddress?: string,
        hookData?: Array<utils.BytesLike>,
    ): Promise<types.TransactionResponse>;
}
