import {
    GameResponse,
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    isValidPlayerName
} from "@wuspy/asteroids-core";
import { Show, createEffect, createSignal } from "solid-js";
import { useApp } from "./AppContext";
import { saveGame } from "./api";
import { ContainerBackgroundShape } from "./yoga-pixi";
import { useTextStyle } from "./solid-pixi";
import { Button, DOMTextInput, InputProps, Modal, TEXT_INPUT_THEME } from "./ui";

const DEFAULT_INFO_TEXT = `${MIN_PLAYER_NAME_LENGTH} - ${MAX_PLAYER_NAME_LENGTH} characters`;
export interface SaveScoreModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: (game: GameResponse) => void;
}

export const SaveScoreModal = (props: SaveScoreModalProps) => {
    const { game, token } = useApp();
    const [infoText, setInfoText] = createSignal(DEFAULT_INFO_TEXT);
    const [passwordInfoText, setPasswordInfoText] = createSignal("");
    const [needsPassword, setNeedsPassword] = createSignal(false);
    const [saving, setSaving] = createSignal(false);
    const [nameInput, setNameInput] = createSignal<DOMTextInput>();
    const [passwordInput, setPasswordInput] = createSignal<DOMTextInput>();

    const inputStyle: Partial<InputProps> = {
        padding: 8,
        fontSize: 32,
        respectAlphaFilter: true,
        fontFamily: useTextStyle().fontFamily as string,
        color: TEXT_INPUT_THEME.textColor,
        alpha: TEXT_INPUT_THEME.textAlpha,
        backgroundStyle: {
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 8,
            fill: TEXT_INPUT_THEME.fill,
            stroke: TEXT_INPUT_THEME.stroke,
        },
        "yg:width": "100%",
        "yg:marginBottom": 32,
    };

    if (!token() || !game.enableLogging) {
        throw new Error("Game is not saveable");
    }

    createEffect(() => {
        if (props.open) {
            setInfoText(DEFAULT_INFO_TEXT);
            setNeedsPassword(false);
        }
    });

    createEffect(() => {
        if (props.open && !saving()) {
            if (needsPassword() && passwordInput()) {
                passwordInput()!.focus();
            } else if (nameInput()) {
                nameInput()!.focus();
            }
        }
    });

    const onSubmit = async () => {
        setSaving(true);
        const response = await saveGame({
            playerName: nameInput()!.value,
            playerNameAuth: passwordInput()?.value,
            score: game.state.score,
            level: game.state.level,
            tokenId: token()!.id,
            log: game.log!,
            version: process.env.npm_package_version!,
        });

        setSaving(false);

        if (response.ok) {
            props.onSaved(response.data);
        } else if (response.status === 401) {
            if (needsPassword()) {
                setPasswordInfoText("Incorrect password.");
            } else {
                setNeedsPassword(true);
                setPasswordInfoText("This name requires a password. Enter it here.");
            }
            setInfoText(DEFAULT_INFO_TEXT);
        } else if (response.data) {
            setInfoText(response.data);
        } else {
            setInfoText("Error contacting server. Try again later.");
        }
    };

    const onNameBeforeinput = (e: InputEvent) => {
        if (e.data) {
            if (!isValidPlayerName(e.data)) {
                e.preventDefault();
                return;
            }
        }
        setNeedsPassword(false);
    };

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    const onFadeOutComplete = () => {
        // Reset
        setNeedsPassword(false);
        setInfoText(DEFAULT_INFO_TEXT);
    };

    const onRequestClose = () => {
        if (!saving()) {
            props.onClose();
        }
    };

    return (
        <Modal
            open={props.open}
            onRequestClose={onRequestClose}
            onFadeOutComplete={onFadeOutComplete}
            header="Enter a Name"
        >
            <container
                yogaContainer
                yg:flexDirection="column"
                yg:alignItems="center"
                yg:padding={8}
                yg:width={360}
            >
                <text
                    text={infoText()}
                    style:align={"center"}
                    style:fontSize={20}
                    style:wordWrap
                    yg:marginBottom={12}
                />
                <input
                    {...inputStyle}
                    ref={setNameInput}
                    disabled={saving()}
                    on:beforeinput={onNameBeforeinput}
                    on:keydown={onKeydown}
                />
                <Show when={needsPassword()}>
                    <text
                        text={passwordInfoText()}
                        style:align={"center"}
                        style:fontSize={20}
                        style:wordWrap
                        yg:marginBottom={12}
                    />
                    <input
                        {...inputStyle}
                        ref={setPasswordInput}
                        type="password"
                        disabled={saving()}
                        on:keydown={onKeydown}
                    />
                </Show>
                <Button text="Save" loading={saving()} type="primary" onClick={onSubmit} />
            </container>
        </Modal>
    );
};
