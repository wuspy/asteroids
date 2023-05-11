import { Button } from "./Button";
export interface ModalCloseButtonProps {
    onClick: () => void;
}

export const ModalCloseButton = (props: ModalCloseButtonProps) =>
    <Button
        type="secondary"
        text="[x]"
        onClick={props.onClick}
    />;
