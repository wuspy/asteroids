import { SaveGameRequest } from "./SaveGameRequest";

export interface ValidUnsavedGame extends SaveGameRequest {
    duration: number;
    shotsFired: number;
    accuracy: number;
    asteroidsDestroyed: number;
    largeUfosDestroyed: number;
    smallUfosDestroyed: number;
}
