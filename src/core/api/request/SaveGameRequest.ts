export interface SaveGameRequest {
    playerName: string,
    score: number,
    level: number,
    tokenId: number,
    log: Uint8Array,
    version: string,
}
