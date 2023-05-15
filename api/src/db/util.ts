export const bufferToUintArray = (buffer: Buffer, bytesPerElement: number): number[] => {
    const len = buffer.byteLength / 4;
    const array = new Array(len);
    for (let i = 0; i < len; ++i) {
        array[i] = buffer.readUIntBE(i * bytesPerElement, bytesPerElement);
    }
    return array;
}

export const uintArrayToBuffer = (array: number[], bytesPerElement: number): Buffer => {
    const buffer = Buffer.allocUnsafe(array.length * bytesPerElement);
    for (let i = 0; i < array.length; ++i) {
        buffer.writeUIntBE(array[i], i * bytesPerElement, bytesPerElement);
    }
    return buffer;
}
