const [J, K] = [24, 55];
const MAX = 2147483647;

export type RandomFn = (min: number, max: number) => number;

// The global unseeded random
export const urandom: RandomFn = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const createRandomSeed = (): number[] => {
    const history = [];
    for (let i = 0; i < K; i++) {
        history.push(urandom(0, MAX));
    }
    return history;
};

// Creates a seeded random function
export const createRandom = (seed: number[]): RandomFn => {
    if (seed.length === K && seed.reduce((valid, x) => valid && x <= MAX, true)) {
        const history = [...seed];
        return (min, max) => {
            const Sj = history[J - 1];
            const Sk = history.pop()!;
            const S0 = Sj ^ Sk;
            history.unshift(S0);
            const value = S0 / MAX;
            return Math.floor(value * (max - min + 1)) + min;
        };
    } else {
        throw new Error("Invalid random seed");
    }
};
