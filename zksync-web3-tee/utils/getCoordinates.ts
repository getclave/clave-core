export const getCoordinates = (publicKey: `0x${string}`): [string, string] => {
    return [publicKey.slice(2, 66), publicKey.slice(66)];
};
