import { Button } from "./Button";
import { ButtonType } from "./theme";

export interface ModalCloseButtonProps {
    onClick: () => void;
}

export const ModalCloseButton = ({ onClick }: ModalCloseButtonProps) =>
    <Button
        type={ButtonType.Secondary}
        text="[x]"
        onClick={onClick}
    />;
