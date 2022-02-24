const [J, K] = [24, 55];
const MAX = 2147483647;
let history: number[];

export const random = (min: number, max: number, useSeededRandom: boolean): number => {
    let value;
    if (useSeededRandom) {
        if (!history) {
            throw new Error("Seeded random not initialized");
        }
        const Sj = history[J - 1];
        const Sk = history.pop()!;
        const S0 = Sj ^ Sk;
        history.unshift(S0);
        value = S0 / MAX;
    } else {
        value = Math.random();
    }
    return Math.floor(value * (max - min + 1)) + min;
}

export const createRandomSeed = (): number[] => {
    const history = [];
    for (let i = 0; i < K; i++) {
        history.push(random(0, MAX, false));
    }
    return history;
}

export const initRandom = (): number[] => {
    const seed = createRandomSeed();
    seedRandom(seed);
    return seed;
}

export const seedRandom = (seed: number[]): boolean => {
    if (seed.length === K && seed.reduce((valid, x) => valid && x <= MAX, true)) {
        history = [...seed];
        return true;
    }
    return false;
}
