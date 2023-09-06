/**
 * Copyright Clave - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
interface IClaveToken {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    icon?: string;
}

interface IClaveERC20Token extends IClaveToken {
    type: 'ERC20';
}

interface IClaveNativeToken extends IClaveToken {
    type: 'native';
}

export type ClaveToken = IClaveERC20Token | IClaveNativeToken;
