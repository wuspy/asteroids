import { GlowFilter } from "@pixi/filter-glow";
import { HighScoreResponse } from "@wuspy/asteroids-core";
import { splitProps } from "solid-js";
import { ContainerBackground, ContainerBackgroundShape } from "./layout";
import { ContainerProps } from "./solid-pixi";
import { UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./ui";

export interface LeaderboardListItemProps extends ContainerProps {
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

export const LeaderboardListItem = (_props: LeaderboardListItemProps) => {
    const [props, childProps] = splitProps(_props, ["selected", "data", "index", "onClick"]);

    const selectedFilters = [new GlowFilter({outerStrength: 1, color: UI_FOREGROUND_COLOR})];
    const textStyle = () => ({
        fill: props.selected ? UI_BACKGROUND_COLOR : UI_FOREGROUND_COLOR,
        fontSize: 24,
    });

    return (
        <container
            {...childProps}
            interactive
            cursor="pointer"
            on:pointertap={e => e.button === 0 && props.onClick(props.index)}
            backgroundStyle={props.selected ? activeBackground : inactiveBackground}
            filters={props.selected ? selectedFilters : null}
            flexContainer
            yg:height={LEADERBOARD_LIST_ITEM_HEIGHT}
            yg:alignItems="center"
            yg:paddingX={12}
            yg:paddingY={6}
        >
            <text
                text={(props.index + 1).toFixed()}
                style={textStyle()}
                alpha={props.selected ? 0.5 : 0.25}
                yg:marginRight={12}
            />
            <text
                text={props.data.name}
                style={textStyle()}
                yg:flexGrow={1}
            />
            <text
                text={props.data.score.toFixed()}
                style={textStyle()}
            />
        </container>
    );
}
