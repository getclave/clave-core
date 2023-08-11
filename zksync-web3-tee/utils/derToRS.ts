import { Buffer } from 'buffer';

export function derToRS(der: Buffer): Array<Buffer> {
    let offset = 3;
    let dataOffset;

    if (der[offset] == 0x21) {
        dataOffset = offset + 2;
    } else {
        dataOffset = offset + 1;
    }
    const r = der.slice(dataOffset, dataOffset + 32);
    offset = offset + der[offset] + 1 + 1;
    if (der[offset] == 0x21) {
        dataOffset = offset + 2;
    } else {
        dataOffset = offset + 1;
    }
    const s = der.slice(dataOffset, dataOffset + 32);
    return [r, s];
}
