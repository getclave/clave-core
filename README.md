# Clave-Core

Library containing everything you need to start working with zksync

## Features

-   Infrastructure for writing to contract, reading from contract and transfer function
-   Customizable TEE (Trusted Execution Environment) signing method
-   Disables the alias, signing function, public key, and public address once initialized.
-   Get token balances using multicall3

## API

```ts
import { Core } from 'clave-core';
import { sign } from 'expo-clave-tee';
import { Provider } from 'zksync-web3';

async function main() {
    const provider = new Provider('https://testnet.era.zksync.dev');
    const username = 'my-key-pair';
    const publicKey = await createKeyPair(username);
    const publicAddress = '0x123...321';

    // Initialize Core
    const core = new Core(provider, publicAddress, username, publicKey, sign);

    // Populated Transaction
    const receiverAddress = '0x114B242D931B47D5cDcEe7AF065856f70ee278C4';
    const transferAmount = BigNumber.from(0);
    const calldata = '0x23423423';
    const populatedTransaction = await core.populateTransaction(
        receiverAddress,
        transferAmount,
        calldata,
    );
    // transaction data
    populatedTransaction.transaction;
    // send
    const validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS;
    const hookData: Array<ethers.utils.BytesLike> = [];
    populatedTransaction.send(validatorAddress, hookData);

    // Basic transfer function
    const transferFunction = async (): Promise<ethers.Transaction> => {
        const receiverAddress = '0x114B242D931B47D5cDcEe7AF065856f70ee278C4';
        const transferAmount = ethers.utils.parseEther("0.001");
        const validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS;
        const hookData: Array<ethers.utils.BytesLike> = [];
        const tx = await core.transfer(
            receiverAddress,
            transferAmount,
            validatorAddress,
            hookData,
        );
    };

    // Send transaction
    const SendTransactionFunction = async (): Promise<ethers.Transaction> => {
        const receiverAddress = '0x114B242D931B47D5cDcEe7AF065856f70ee278C4';
        const transferAmount = BigNumber.from(0);
        const calldata = '0x23423423';
        const validatorAddress = CONSTANT_ADDRESSES.VALIDATOR_ADDRESS;
        const hookData: Array<ethers.utils.BytesLike> = [];

        const tx = await core.sendTransaction(
            receiverAddress,
            transferAmount,
            calldata,
            validatorAddress,
            hookData,
        );
    };

    // Initialize Contract
    const contract = core.Contract(
        '0x123...321', // Contract address
        [], // Contract ABI
    );

    // Read contract
    const getCount = async (): Promise<void> => {
        const count = await contract.read('count', []);
    };

    // Write contract
    const increase = async (): Promise<ethers.Transaction> => {
        const tx = await contract.write('increase', [7]);
    };

    // Get token balances using multicall3
    const tokens = [
        '0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b',
        '0x40609141Db628BeEE3BfAB8034Fc2D8278D0Cc78',
    ];
    const balances = await core.getBalancesWithMultiCall3(tokens);
}
```
