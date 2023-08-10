import { HexString } from '../types';

export const getCoordinates = (publicKey: HexString): [string, string] => {
    return [publicKey.slice(2, 66), publicKey.slice(66)];
};
