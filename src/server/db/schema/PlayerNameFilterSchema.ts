import { PlayerNameFilterAction } from "../../PlayerNameFilterAction";

export interface PlayerNameFilterSchema {
    phrase: string;
    action: PlayerNameFilterAction;
}
