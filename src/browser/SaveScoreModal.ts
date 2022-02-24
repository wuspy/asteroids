import { TickQueue, EventManager } from "@core/engine";
import { Container } from "@pixi/display";
import { GameTokenResponse, MIN_PLAYER_NAME_LENGTH, MAX_PLAYER_NAME_LENGTH, isValidPlayerNameCodePoint } from "@core/api";
import { GameState } from "@core";
import { ApiErrorType, saveGame } from "./api";
import { Align, FlexDirection } from "./layout";
import { Button, ButtonType, Modal, Text, TextInput, UI_FOREGROUND_COLOR } from "./ui";
import { UIEvents } from "./UIEvents";

export class SaveScoreModal extends Modal {
    private readonly _apiRoot: string;
    private readonly _state: GameState;
    private readonly _token: GameTokenResponse;
    private readonly _log: Uint8Array;
    private readonly _events: EventManager<UIEvents>;
    private readonly _saveButton: Button;
    private readonly _info: Text;
    private readonly _input: TextInput;
    private _saving: boolean;

    constructor(params: {
        queue: TickQueue;
        events: EventManager<UIEvents>;
        apiRoot: string;
        state: GameState;
        log: Uint8Array;
        token: GameTokenResponse;
    }) {
        super({
            queue: params.queue,
            header: {
                title: "Enter a Name",
                rightContent: new Button({
                    queue: params.queue,
                    type: ButtonType.Secondary,
                    text: "[x]",
                    onClick: () => {
                        if (!this._saving) {
                            params.events.trigger("closeSaveScore", false);
                        }
                    },
                }),
            },
        });
        this._saving = false;
        this._apiRoot = params.apiRoot;
        this._state = params.state;
        this._token = params.token;
        this._log = params.log;
        this._events = params.events;

        const content = new Container();
        content.flexContainer = true;
        content.layout.style({
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
            padding: 8,
            width: 360,
        });
        this.addChild(content);

        this._info = new Text(`${MIN_PLAYER_NAME_LENGTH} - ${MAX_PLAYER_NAME_LENGTH} characters`, {
            fontSize: 20,
            fill: UI_FOREGROUND_COLOR,
            wordWrap: true,
            align: "center",
        });
        this._info.layout.style({
            marginBottom: 12,
        });
        content.addChild(this._info);

        this._input = new TextInput(32);
        this._input.layout.style({
            width: "100%",
            marginBottom: 32,
        });
        this._input.align = "center";
        this._input.maxLength = MAX_PLAYER_NAME_LENGTH;
        this._input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submit();
            }
        });
        if (typeof String.prototype.codePointAt === "function"
            && window.InputEvent
            && typeof InputEvent.prototype.getTargetRanges === "function"
        ) {
            this._input.addEventListener("beforeinput", (e: InputEvent) => {
                if (e.data) {
                    for (const char of e.data) {
                        if (!isValidPlayerNameCodePoint(char.codePointAt(0)!)) {
                            e.preventDefault();
                            break;
                        }
                    }
                }
            });
        }
        this._input.focus();
        content.addChild(this._input);

        this._saveButton = new Button({
            queue: params.queue,
            type: ButtonType.Primary,
            text: "Save",
            onClick: () => this.submit(),
        }),
        content.addChild(this._saveButton);
    }

    private async submit(): Promise<void> {
        if (!this._saving) {
            this._saving = true;
            this._saveButton.loading = true;
            this._input.disabled = true;
            const response = await saveGame(this._apiRoot, {
                playerName: this._input.value,
                score: this._state.score,
                level: this._state.level,
                tokenId: this._token.id,
                log: this._log,
                version: process.env.npm_package_version!,
            });
            if (response.ok) {
                this._events.trigger("closeSaveScore", true);
            } else {
                this._saving = false;
                this._saveButton.loading = false;
                this._input.disabled = false;
                if (response.error === ApiErrorType.ApiError) {
                    this._info.text = response.message;
                } else {
                    this._info.text = "Error contacting server. Try again later.";
                }
            }
        }
    }
}
