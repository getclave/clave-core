// import { zksync } from './zksync';
// class Contract extends zksync.Contract {
//     constructor(address, abi, signer) {
//         super(address, abi, signer);
//     }
// }
import { Contract, Provider, Signer } from 'zksync-web3';

import { Wallet } from './wallet';

const msFN = async (alias, hexMessage, prompt) => {
    return '0x';
};

const provider = new Provider('https://rinkeby-api.zksync.io/jsrpc');
const signer = new Wallet(
    'alim',
    msFN,
    '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    undefined,
);

const contract = new Contract(
    '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    [],
    signer,
);
