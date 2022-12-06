import { Container, RefType, Text } from "./react-pixi";
import { MIN_PLAYER_NAME_LENGTH, MAX_PLAYER_NAME_LENGTH, isValidPlayerNameCodePoint, GameResponse } from "../core/api";
import { ApiErrorType, saveGame } from "./api";
import { Align, FlexDirection } from "./layout";
import { Button, ButtonType, FONT_STYLE, Modal, ModalCloseButton, TextInput } from "./ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./AppContext";

const DEFAULT_INFO_TEXT = `${MIN_PLAYER_NAME_LENGTH} - ${MAX_PLAYER_NAME_LENGTH} characters`;

export interface SaveScoreModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: (game: GameResponse) => void;
}

export const SaveScoreModal = ({ open, onClose, onSaved }: SaveScoreModalProps) => {
    const { game, token } = useApp();
    const [infoText, setInfoText] = useState(DEFAULT_INFO_TEXT);
    const [passwordInfoText, setPasswordInfoText] = useState("");
    const [needsPassword, setNeedsPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const nameInput = useRef<RefType<typeof TextInput>>(null);
    const passwordInput = useRef<RefType<typeof TextInput>>(null);

    useEffect(() => {
        if (open && !saving) {
            if (needsPassword && passwordInput.current) {
                passwordInput.current.focus();
            } else if (nameInput.current) {
                nameInput.current.focus();
            }
        }
    }, [needsPassword, saving, open]);

    if (!token || !game.enableLogging) {
        throw new Error("Game is not saveable");
    }

    const onSubmit = useCallback(async () => {
        setSaving(true);
        const response = await saveGame({
            playerName: nameInput.current!.value,
            playerNameAuth: passwordInput.current?.value,
            score: game.state.score,
            level: game.state.level,
            tokenId: token.id,
            log: game.log!,
            version: process.env.npm_package_version!,
        });

        setSaving(false);

        if (response.ok) {
            onSaved(response.data);
        } else if (response.error === ApiErrorType.HttpError && response.status === 401) {
            if (needsPassword) {
                setPasswordInfoText("Incorrect password.");
            } else {
                setNeedsPassword(true);
                setPasswordInfoText("This name requires a password. Enter it here.");
            }
            setInfoText(DEFAULT_INFO_TEXT);
        } else if (response.error === ApiErrorType.ApiError) {
            setInfoText(response.message);
        } else {
            setInfoText("Error contacting server. Try again later.");
        }
    }, [game, needsPassword]);

    const onNameBeforeinput = useCallback((e: InputEvent) => {
        if (e.data) {
            for (const char of e.data) {
                if (!isValidPlayerNameCodePoint(char.codePointAt(0)!)) {
                    e.preventDefault();
                    return;
                }
            }
        }
        setNeedsPassword(false);
    }, []);

    const onKeydown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    }, [onSubmit]);

    const onFadeOutComplete = () => {
        // Reset
        setNeedsPassword(false);
        setInfoText(DEFAULT_INFO_TEXT);
    };

    const passwordField = needsPassword
        ? <>
            <Text
                text={passwordInfoText}
                style={{ ...FONT_STYLE, fontSize: 20, wordWrap: true, align: "center" }}
                layoutStyle={{ marginBottom: 12 }}
            />
            <TextInput
                ref={passwordInput}
                type="password"
                disabled={saving}
                keydown={onKeydown}
                fontSize={32}
                layoutStyle={{ width: "100%", marginBottom: 32 }}
            />
        </>
        : null;

    return (
        <Modal
            open={open}
            onFadeOutComplete={onFadeOutComplete}
            headerTitle="Enter a Name"
            headerRightContent={<ModalCloseButton onClick={onClose} />}
        >
            <Container
                flexContainer
                layoutStyle={{
                    flexDirection: FlexDirection.Column,
                    alignItems: Align.Center,
                    padding: 8,
                    width: 360,
                }}>
                <Text
                    text={infoText}
                    style={{ ...FONT_STYLE, fontSize: 20, wordWrap: true, align: "center" }}
                    layoutStyle={{ marginBottom: 12 }}
                />
                <TextInput
                    ref={nameInput}
                    disabled={saving}
                    beforeinput={onNameBeforeinput}
                    keydown={onKeydown}
                    fontSize={32}
                    layoutStyle={{ width: "100%", marginBottom: 32 }}
                />
                {passwordField}
                <Button text="Save" loading={saving} type={ButtonType.Primary} onClick={onSubmit} />
            </Container>
        </Modal>
    );
};
