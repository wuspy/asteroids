import { TickQueue, EventManager } from "../core/engine";
import { Container } from "@pixi/display";
import { GameTokenResponse, MIN_PLAYER_NAME_LENGTH, MAX_PLAYER_NAME_LENGTH, isValidPlayerNameCodePoint } from "../core/api";
import { GameState } from "../core";
import { ApiErrorType, saveGame } from "./api";
import { Align, FlexDirection } from "./layout";
import { Button, ButtonType, Modal, Text, TextInput } from "./ui";
import { UIEvents } from "./UIEvents";

const DEFAULT_INFO_TEXT = `${MIN_PLAYER_NAME_LENGTH} - ${MAX_PLAYER_NAME_LENGTH} characters`;

export class SaveScoreModal extends Modal {
    private readonly _state: GameState;
    private readonly _token: GameTokenResponse;
    private readonly _log: Uint8Array;
    private readonly _events: EventManager<UIEvents>;
    private readonly _saveButton: Button;
    private readonly _info: Text;
    private _passwordInfo?: Text;
    private readonly _input: TextInput;
    private _passwordInput?: TextInput;
    private readonly _passwordContainer: Container;
    private _saving: boolean;

    constructor(params: {
        queue: TickQueue;
        events: EventManager<UIEvents>;
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

        this._info = new Text(DEFAULT_INFO_TEXT, {
            fontSize: 20,
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
        this._input.addInputEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.submit();
            }
        });
        if (typeof String.prototype.codePointAt === "function"
            && window.InputEvent
            && typeof InputEvent.prototype.getTargetRanges === "function"
        ) {
            this._input.addInputEventListener("beforeinput", (e: InputEvent) => {
                if (e.data) {
                    for (const char of e.data) {
                        if (!isValidPlayerNameCodePoint(char.codePointAt(0)!)) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
                this.hidePasswordField();
            });
        }
        this._input.focus();
        content.addChild(this._input);

        this._passwordContainer = new Container();
        this._passwordContainer.flexContainer = true;
        this._passwordContainer.visible = false;
        this._passwordContainer.layout.style({
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
        });
        content.addChild(this._passwordContainer);

        this._saveButton = new Button({
            queue: params.queue,
            type: ButtonType.Primary,
            text: "Save",
            onClick: () => this.submit(),
        }),
        content.addChild(this._saveButton);
    }

    private hidePasswordField(): void {
        if (this._passwordInput) {
            this._passwordInput.destroy({ children: true });
            this._passwordInput = undefined;
        }
        if (this._passwordInfo) {
            this._passwordInfo.destroy();
            this._passwordInfo = undefined;
        }
        this._passwordContainer.visible = false;
    }

    private async submit(): Promise<void> {
        if (!this._saving) {
            this._saving = true;
            this._saveButton.loading = true;
            this._input.disabled = true;
            if (this._passwordInput) {
                this._passwordInput.disabled = true;
            }
            const response = await saveGame({
                playerName: this._input.value,
                playerNameAuth: this._passwordInput?.value,
                score: this._state.score,
                level: this._state.level,
                tokenId: this._token.id,
                log: this._log,
                version: process.env.npm_package_version!,
            });
            if (response.ok) {
                this._events.trigger("closeSaveScore", true);
            } else if (response.error === ApiErrorType.HttpError && response.status === 401) {
                this._saving = false;
                this._saveButton.loading = false;
                this._input.disabled = false;
                if (!this._passwordInput || !this._passwordInfo) {
                    this._passwordInfo = new Text(`${MIN_PLAYER_NAME_LENGTH} - ${MAX_PLAYER_NAME_LENGTH} characters`, {
                        fontSize: 20,
                        wordWrap: true,
                        align: "center",
                    });
                    this._info.text = DEFAULT_INFO_TEXT;
                    this._passwordInfo.text = "This name requires a password. Enter it here.";
                    this._passwordInfo.layout.style({
                        marginBottom: 12,
                    });
                    this._passwordInput = new TextInput(32);
                    this._passwordInput.layout.style({
                        width: "100%",
                        marginBottom: 32,
                    });
                    this._passwordInput.addInputEventListener("keydown", (e: KeyboardEvent) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            this.submit();
                        }
                    });
                    this._passwordInput.align = "center";
                    this._passwordInput.type = "password";
                    this._passwordContainer.addChild(this._passwordInfo, this._passwordInput);
                    this._passwordContainer.visible = true;
                } else {
                    this._passwordInfo.text = "Incorrect password.";
                    this._passwordInput.disabled = false;
                }
                this._passwordInput.focus();
            } else {
                this._saving = false;
                this._saveButton.loading = false;
                this._input.disabled = false;
                if (response.error === ApiErrorType.ApiError) {
                    this._info.text = response.message;
                } else {
                    this._info.text = "Error contacting server. Try again later.";
                }
                this.hidePasswordField();
                this._input.focus();
            }
        }
    }
}
