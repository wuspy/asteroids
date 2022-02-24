const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";

export const encodeInt = (x: number): string => {
    if (x < 0 || isNaN(x) || x % 1) {
        throw new Error(`${x.toString()} is not a positive integer`);
    }
    let digit;
    let residual = Math.floor(x);
    let result = '';
    do {
        digit = residual % 64
        result = DIGITS.charAt(digit) + result;
        residual = Math.floor(residual / 64);
    } while (residual);

    return result;
};

export const decodeInt = (x: string): number => {
    let result = 0;
    const digits = x.split('');
    for (let i = 0; i < digits.length; ++i) {
        result = (result * 64) + DIGITS.indexOf(digits[i]);
    }
    return result;
}

export const encodeIntArray = (array: number[]): string => array.map(encodeInt).toString();
export const decodeIntArray = (str: string): number[] => str.split(",").map(decodeInt);
