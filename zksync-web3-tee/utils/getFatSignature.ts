import { Buffer } from 'buffer';
import * as ethers from 'ethers';

import { abiCoder, bufferToHex, derToRS, getCoordinates } from '.';

export const getFatSignature = async (
    customSignatureAsHex: string,
    publicKey: string,
): Promise<string> => {
    const signatureBuffer = Buffer.from(customSignatureAsHex, 'hex');

    const rsBuffer = derToRS(signatureBuffer);

    const r = ethers.BigNumber.from(bufferToHex(rsBuffer[0]));
    const s = ethers.BigNumber.from(bufferToHex(rsBuffer[1]));
    const coordinates = getCoordinates(publicKey as `0x${string}`);

    const x = ethers.BigNumber.from('0x' + coordinates[0]);
    const y = ethers.BigNumber.from('0x' + coordinates[1]);

    const signature = abiCoder.encode(
        ['uint256[2]', 'uint256[2]'],
        [
            [r, s],
            [x, y],
        ],
    ) as `0x${string}`;

    return signature;
};
