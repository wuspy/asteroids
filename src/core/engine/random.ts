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

export const initRandom = (): string => {
    history = [];
    for (let i = 0; i < K; i++) {
        history.push(random(0, MAX, false));
    }
    return history.map((x) => x.toString(36)).toString();
}

export const seedRandom = (seed: string): boolean => {
    try {
        const maybeHistory = seed.split(",").map((x) => parseInt(x, 36));
        if (maybeHistory.length === K && maybeHistory.reduce((valid, x) => valid && x >= 0 && x <= MAX, true)) {
            history = maybeHistory;
            return true;
        }
        return false;
    } catch (Error) {
        return false;
    }
}
