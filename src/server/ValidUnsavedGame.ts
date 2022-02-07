import { SaveGameRequest } from "@core/api";

export interface ValidUnsavedGame extends SaveGameRequest {
    duration: number;
    shotsFired: number;
    asteroidsDestroyed: number;
    largeUfosDestroyed: number;
    smallUfosDestroyed: number;
}
