export interface Game {
    id: number;
    playerName: string;
    score: number;
    level: number;
    duration: number;
    shotsFired: number;
    accuracy: number;
    largeUfosDestroyed: number;
    smallUfosDestroyed: number;
    asteroidsDestroyed: number;
    randomSeed: number[];
    log: Buffer;
    version: string;
    timeAdded: string;
}
