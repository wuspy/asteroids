export interface SaveGameRequest {
    playerName: string,
    playerNameAuth?: string,
    score: number,
    level: number,
    tokenId: number,
    log: Uint8Array,
    version: string,
}
