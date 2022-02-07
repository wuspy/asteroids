import { TickQueue, EventManager } from "@core/engine";
import { Container } from "@pixi/display";
import { GameTokenResponse, MAX_PLAYER_NAME_LENGTH } from "@core/api";
import { GameState } from "@core";
import { ApiErrorType, saveGame } from "./api";
import { Align, FlexDirection } from "./layout";
import { Button, ButtonType, Modal, Text, TextInput, UI_FOREGROUND_COLOR } from "./ui";
import { UIEvents } from "./UIEvents";

export class SaveScoreModal extends Modal {
    private readonly _apiRoot: string;
    private readonly _state: GameState;
    private readonly _token: GameTokenResponse;
    private readonly _log: string;
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
        log: string;
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
        content.layout.flexDirection = FlexDirection.Column;
        content.layout.padding = 12;
        this.addChild(content);

        this._info = new Text(`${MAX_PLAYER_NAME_LENGTH} characters max`, {
            fontSize: 20,
            fill: UI_FOREGROUND_COLOR,
            wordWrap: true,
            wordWrapWidth: 320,
        });
        this._info.layout.style({
            marginBottom: 12,
            alignSelf: Align.Center,
        });
        content.addChild(this._info);

        this._input = new TextInput(32);
        this._input.layout.style({
            width: 320,
            marginBottom: 32,
        });
        this._input.align = "center";
        this._input.maxLength = MAX_PLAYER_NAME_LENGTH;
        this._input.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "Tab") {
                e.preventDefault();
            } else if (e.key === "Enter") {
                e.preventDefault();
                this.submit();
            }
        });
        this._input.focus();
        content.addChild(this._input);

        this._saveButton = new Button({
            queue: params.queue,
            type: ButtonType.Primary,
            text: "Save",
            onClick: () => this.submit(),
        }),
        this._saveButton.layout.alignSelf = Align.Center;
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
