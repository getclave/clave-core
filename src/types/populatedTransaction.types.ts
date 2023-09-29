import { type utils } from 'ethers';
import type { types } from 'zksync-web3';

export interface IPopulatedTransaction {
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
