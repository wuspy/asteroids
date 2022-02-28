import { MAX_PLAYER_NAME_LENGTH, MIN_PLAYER_NAME_LENGTH, isValidPlayerNameCodePoint } from "../core/api";
import * as bcrypt from "bcrypt";
import { findPlayerNameFilters, findReservedPlayerNames } from "./db";
import { PlayerNameFilterAction } from "./db/schema";

const DEFAULT_ERROR = "Enter another name.";
const DB_SYNC_INTERVAL = 5000;

const NON_LETTER_REGEX = /[ '0-9]/;

let reservedNames: { [Key in string]: string } | undefined = undefined;
let filters: { [Key in string]: PlayerNameFilterAction } | undefined = undefined;
let dbSyncTime: number = -DB_SYNC_INTERVAL;

export type NameValidatorResult = {
    ok: true;
    playerName: string;
} | {
    ok: false;
    error: string;
} | {
    ok: false;
    unauthorized: true;
};

export const validatePlayerName = async (name: string, auth?: any): Promise<NameValidatorResult> => {
    if (typeof name !== "string") {
        return { ok: false, error: DEFAULT_ERROR };
    }

    name = name.trim();

    if (name.length < MIN_PLAYER_NAME_LENGTH) {
        return { ok: false, error: "Enter a longer name." };
    }
    if (name.length > MAX_PLAYER_NAME_LENGTH) {
        return { ok: false, error: "Enter a shorter name." };
    }

    for (const char of name) {
        const code = char.codePointAt(0)!;
        if (!isValidPlayerNameCodePoint(code)) {
            return { ok: false, error: DEFAULT_ERROR };
        }
    }

    const now = performance.now();
    if (reservedNames === undefined || filters === undefined || now - dbSyncTime >= DB_SYNC_INTERVAL) {
        const reservedNamesTask = findReservedPlayerNames();
        const filtersTask = findPlayerNameFilters();
        reservedNames = await reservedNamesTask;
        filters = await filtersTask;
        dbSyncTime = now;
    }

    const normalizedName = name.toLocaleLowerCase();
    if (normalizedName in reservedNames && (!auth || !await bcrypt.compare(auth, reservedNames[normalizedName]))) {
        return { ok: false, unauthorized: true };
    }

    const normalizedParts = normalizedName.split(NON_LETTER_REGEX);
    if (normalizedParts.length > 1) {
        normalizedParts.unshift(normalizedName);
    }

    for (const [phrase, action] of Object.entries(filters)) {
        for (const part of normalizedParts) {
            if (phrase === part) {
                if (action === PlayerNameFilterAction.WhitelistExactMatch) {
                    break;
                } else {
                    return { ok: false, error: DEFAULT_ERROR };
                }
            } else if (part.includes(phrase) && action === PlayerNameFilterAction.BlacklistContains) {
                return { ok: false, error: DEFAULT_ERROR };
            }
        }
    }

    return { ok: true, playerName: name };
}
