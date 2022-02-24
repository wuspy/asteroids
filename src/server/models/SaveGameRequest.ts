import { SaveGameRequest as CoreSaveGameRequest } from "@core/api";

export interface SaveGameRequest extends CoreSaveGameRequest {
    log: Buffer;
}
