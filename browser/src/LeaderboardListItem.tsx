import { HighScoreResponse } from "@wuspy/asteroids-core";
import { FederatedPointerEvent } from "@pixi/events";
import { GlowFilter } from "@pixi/filter-glow";
import { ComponentProps, useMemo } from "react";
import { Align, ContainerBackground, ContainerBackgroundShape } from "./layout";
import { Container, Text } from "./react-pixi";
import { FONT_STYLE, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./ui";

export interface LeaderboardListItemProps extends ComponentProps<typeof Container> {
    selected?: boolean;
    data: HighScoreResponse;
    index: number;
    onClick: (index: number) => void;
}

export const LEADERBOARD_LIST_ITEM_HEIGHT = 48;

// Still need a background to recieve input events
const inactiveBackground: ContainerBackground = {
    shape: ContainerBackgroundShape.Rectangle,
    fill: {
        color: 0,
        alpha: 0.0001,
    },
};

const activeBackground: ContainerBackground = {
    shape: ContainerBackgroundShape.Rectangle,
    fill: {
        color: 0xffffff,
        alpha: 0.8,
    },
};

export const LeaderboardListItem = ({ selected = false, data, index, onClick, ...props }: LeaderboardListItemProps) => {
    const selectedFilters = useMemo(() => [new GlowFilter({outerStrength: 1, color: UI_FOREGROUND_COLOR})], []);
    const textStyle = useMemo(() => ({
        ...FONT_STYLE,
        fill: selected ? UI_BACKGROUND_COLOR : UI_FOREGROUND_COLOR,
        fontSize: 24,
    }), [selected]);

    const onPointerTap = (e: FederatedPointerEvent) => e.button === 0 && onClick(index);

    return (
        <Container
            {...props}
            interactive
            cursor="pointer"
            on:pointertap={onPointerTap}
            backgroundStyle={selected ? activeBackground : inactiveBackground}
            filters={selected ? selectedFilters : null}
            flexContainer
            layoutStyle={{
                ...props.layoutStyle,
                height: LEADERBOARD_LIST_ITEM_HEIGHT,
                alignItems: Align.Center,
                paddingX: 12,
                paddingY: 6,
            }}
        >
            <Text
                text={(index + 1).toFixed()}
                style={textStyle}
                alpha={selected ? 0.5 : 0.25}
                layoutStyle={{ marginRight: 12 }}
            />
            <Text
                text={data.name}
                style={textStyle}
                layoutStyle={{ flexGrow: 1 }}
            />
            <Text
                text={data.score.toFixed()}
                style={textStyle}
            />
        </Container>
    );
}
