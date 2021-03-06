export interface GameResponse {
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
    randomSeed: string;
    version: string;
    timeAdded: string;
}
