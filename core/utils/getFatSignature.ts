import { Buffer } from 'buffer';
import * as ethers from 'ethers';

import { abiCoder, bufferToHex, derToRS, getCoordinates } from '.';
import { HexString } from '../types';

export const getFatSignature = async (
    customSignatureAsHex: string,
    publicKey: string,
): Promise<string> => {
    const signatureBuffer = Buffer.from(customSignatureAsHex, 'hex');

    const rsBuffer = derToRS(signatureBuffer);

    const r = ethers.BigNumber.from(bufferToHex(rsBuffer[0]));
    const s = ethers.BigNumber.from(bufferToHex(rsBuffer[1]));
    const coordinates = getCoordinates(publicKey as HexString);

    const x = ethers.BigNumber.from('0x' + coordinates[0]);
    const y = ethers.BigNumber.from('0x' + coordinates[1]);

    const signature = abiCoder.encode(
        ['uint256[2]', 'uint256[2]'],
        [
            [r, s],
            [x, y],
        ],
    ) as HexString;

    return signature;
};
