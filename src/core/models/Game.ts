export interface Game {
    gameId: number,
    username: string,
    score: number,
    level: number,
    shotsFired: number,
    largeUfosDestroyed: number,
    smallUfosDestroyed: number,
    asteroidsDestroyed: number,
    randomSeed: string,
    log: string,
    version: string,
    timestamp: string,
}
