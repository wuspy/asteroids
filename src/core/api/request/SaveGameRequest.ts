export interface SaveGameRequest {
    playerName: string,
    score: number,
    level: number,
    tokenId: number,
    log: string,
    version: string,
}