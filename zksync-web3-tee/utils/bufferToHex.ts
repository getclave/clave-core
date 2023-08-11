export function bufferToHex(buffer: ArrayBufferLike): string {
    return '0x'.concat(
        [...new Uint8Array(buffer)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''),
    );
}
