import { ITextStyle, Text } from "@pixi/text"
import { registerPixiComponent, PixiContainerProps } from "../element";
import { displayObjectSetProp } from "../props";
import { ParentProps, createContext, mergeProps, splitProps, useContext } from "solid-js";

const TextStyleContext = createContext<Partial<ITextStyle>>({ });

export const useTextStyle = () => useContext(TextStyleContext);

export const TextStyleProvider = (props: ParentProps<Partial<ITextStyle>>) => {
    const [children, style] = splitProps(
        mergeProps(props, useTextStyle()),
        ["children"]
    );

    return (
        <TextStyleContext.Provider value={style}>
            {children.children}
        </TextStyleContext.Provider>
    );
}

export type TextProps = Omit<PixiContainerProps<Text>, "style">
    & { style?: Partial<ITextStyle> }
    & { [P in keyof ITextStyle as `style:${P}`]?: ITextStyle[P] };

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            text: TextProps,
        }
    }
}

registerPixiComponent<TextProps, Text>("text", {
    create() {
        const text = new Text();
        text.style = useTextStyle();
        return text;
    },
    setProp(instance, prop, newValue, oldValue) {
        if (prop.startsWith("style:")) {
            (instance.style as any)[prop.substring(6)] = newValue;
        } else if (prop === "style") {
            instance.style = { ...useTextStyle(), ...newValue as ITextStyle };
        } else {
            displayObjectSetProp(instance, prop, newValue, oldValue);
        }
    },
});
