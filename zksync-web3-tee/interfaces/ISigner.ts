import {
    TypedDataDomain,
    TypedDataField,
} from '@ethersproject/abstract-signer';
import { BigNumber } from 'ethers';
import { Provider, types } from 'zksync-web3';

export interface ISigner extends Signer {}

export interface Signer {
    /**
     *  The [[Provider]] attached to this Signer (if any).
     */
    provider: undefined | Provider;

    /**
     *  Returns a new instance of this Signer connected to //provider// or detached
     *  from any Provider if null.
     */
    connect(provider: Provider): any;

    ////////////////////
    // State

    /**
     *  Get the address of the Signer.
     */
    getAddress(): Promise<string>;

    /**
     *  Gets the next nonce required for this Signer to send a transaction.
     */
    getTransactionCount(): Promise<number>;

    ////////////////////
    // Preparation

    /**
     *  Prepares a {@link TransactionRequest} for calling:
     *  - resolves ``to`` and ``from`` addresses
     *  - if ``from`` is specified , check that it matches this Signer
     *
     *  @param tx - The call to prepare
     */
    populateCall(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest>;

    /**
     *  Prepares a {@link TransactionRequest} for sending to the network by
     *  populating any missing properties:
     *  - resolves ``to`` and ``from`` addresses
     *  - if ``from`` is specified , check that it matches this Signer
     *  - populates ``nonce`` via ``signer.getNonce("pending")``
     *  - populates ``gasLimit`` via ``signer.estimateGas(tx)``
     *  - populates ``chainId`` via ``signer.provider.getNetwork()``
     *  - populates ``type`` and relevant fee data for that type (``gasPrice``
     *    for legacy transactions, ``maxFeePerGas`` for EIP-1559, etc)
     *
     *  @note Some Signer implementations may skip populating properties that
     *        are populated downstream; for example JsonRpcSigner defers to the
     *        node to populate the nonce and fee data.
     *
     *  @param tx - The call to prepare
     */
    populateTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionRequest>;

    ////////////////////
    // Execution

    /**
     *  Estimates the required gas required to execute //tx// on the Blockchain. This
     *  will be the expected amount a transaction will require as its ``gasLimit``
     *  to successfully run all the necessary computations and store the needed state
     *  that the transaction intends.
     *
     *  Keep in mind that this is **best efforts**, since the state of the Blockchain
     *  is in flux, which could affect transaction gas requirements.
     *
     *  @throws UNPREDICTABLE_GAS_LIMIT A transaction that is believed by the node to likely
     *          fail will throw an error during gas estimation. This could indicate that it
     *          will actually fail or that the circumstances are simply too complex for the
     *          node to take into account. In these cases, a manually determined ``gasLimit``
     *          will need to be made.
     */
    estimateGas(tx: types.TransactionRequest): Promise<BigNumber>;

    /**
     *  Evaluates the //tx// by running it against the current Blockchain state. This
     *  cannot change state and has no cost in ether, as it is effectively simulating
     *  execution.
     *
     *  This can be used to have the Blockchain perform computations based on its state
     *  (e.g. running a Contract's getters) or to simulate the effect of a transaction
     *  before actually performing an operation.
     */
    call(tx: types.TransactionRequest): Promise<string>;

    /**
     *  Resolves an ENS Name to an address.
     */
    resolveName(name: string): Promise<string>;

    ////////////////////
    // Signing

    /**
     *  Signs %%tx%%, returning the fully signed transaction. This does not
     *  populate any additional properties within the transaction.
     */
    signTransaction(tx: types.TransactionRequest): Promise<string>;

    /**
     *  Sends %%tx%% to the Network. The ``signer.populateTransaction(tx)``
     *  is called first to ensure all necessary properties for the
     *  transaction to be valid have been popualted first.
     */
    sendTransaction(
        tx: types.TransactionRequest,
    ): Promise<types.TransactionResponse>;

    /**
     *  Signers an [[link-eip-191]] prefixed personal message.
     *
     *  If the %%message%% is a string, it is signed as UTF-8 encoded bytes. It is **not**
     *  interpretted as a [[BytesLike]]; so the string ``"0x1234"`` is signed as six
     *  characters, **not** two bytes.
     *
     *  To sign that example as two bytes, the Uint8Array should be used
     *  (i.e. ``new Uint8Array([ 0x12, 0x34 ])``).
     */
    signMessage(message: string | Uint8Array): Promise<string>;

    /**
     *  Signs the [[link-eip-712]] typed data.
     */
    signTypedData(
        domain: TypedDataDomain,
        types: Record<string, Array<TypedDataField>>,
        value: Record<string, any>,
    ): Promise<string>;

    getBalance(): Promise<BigNumber>;
}
