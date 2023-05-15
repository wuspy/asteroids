import { SaveGameRequest as CoreSaveGameRequest } from "@wuspy/asteroids-core";

export interface SaveGameRequest extends CoreSaveGameRequest {
    log: Buffer;
}
