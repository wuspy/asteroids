import { HighScoreResponse } from "@wuspy/asteroids-core";
import { Match, Show, Switch, createEffect, createResource, createSignal } from "solid-js";
import { LEADERBOARD_LIST_ITEM_HEIGHT, LeaderboardListItem } from "./LeaderboardListItem";
import { empty, error, getHighScores, some } from "./api";
import { Divider, LoadingAnimation, Modal, UI_FOREGROUND_COLOR, VirtualizedList, VirtualizedListActions } from "./ui";

interface PlaceholderProps {
    loading: boolean;
    message: string;
}

const Placeholder = (props: PlaceholderProps) =>
    <container
        flexContainer
        yg:flexDirection="column"
        yg:position="absolute"
        yg:alignItems="center"
        yg:justifyContent="center"
        yg:top={0}
        yg:left={0}
        yg:right={0}
        yg:bottom={0}
    >
        <Show when={props.loading}>
            <LoadingAnimation diameter={120} color={UI_FOREGROUND_COLOR} yg:marginY={12} />
        </Show>
        <text
            text={props.message}
            style:fontSize={20}
            style:wordWrap
            style:align="center"
            yg:marginY={12}
        />
    </container>;

const DetailItem = (props: { text: string }) =>
    <text {...props} style:fontSize={20} yg:marginY={4} />;

const formatTime = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    return `${Math.floor(seconds / 60).toFixed(0)}m ${(seconds % 60).toFixed(0)}s`;
};

export interface LeaderboardProps {
    open: boolean;
    onClose: () => void;
    selectedId?: number;
}

export const LeaderboardModal = (props: LeaderboardProps) => (
    <Modal
        open={props.open}
        header="Leaderboard"
        onRequestClose={props.onClose}
    >
        <container flexContainer yg:width={800} yg:height={390}>
            <Content selectedId={props.selectedId} />
        </container>
    </Modal>
);

interface ContentProps {
    selectedId?: number,
}

const Content = (props: ContentProps) => {
    const [items] = createResource(getHighScores);
    const [listActions, setListActions] = createSignal<VirtualizedListActions>();
    const [selectedIndex, setSelectedIndex] = createSignal(0);

    createEffect(() => {
        if (props.selectedId !== undefined && some(items)) {
            const selectedIndex = some(items)!.findIndex(item => item.id === props.selectedId);
            if (selectedIndex !== -1) {
                setSelectedIndex(selectedIndex);
                setTimeout(() => {
                    listActions()?.scrollToIndex(selectedIndex, true, true);
                }, 100);
            }
        }
    });

    return <Switch>
        <Match when={items.loading}>
            <Placeholder loading message="Connecting to mainframe..." />
        </Match>
        <Match when={empty(items)}>
            <Placeholder loading message="There's nothing here." />;
        </Match>
        <Match when={error(items)}>{message =>
            <Placeholder loading={false} message={message()} />}
        </Match>
        <Match when={some(items)}>{items => {
            const selectedItem = () => items()[selectedIndex()];

            return <>
                <VirtualizedList
                    data={items()}
                    actions={setListActions}
                    overscroll={12}
                    itemHeight={LEADERBOARD_LIST_ITEM_HEIGHT}
                    yg:width={400}
                    yg:height="100%"
                    yg:flexShrink={0}
                >
                    {props => <LeaderboardListItem
                        {...props}
                        selected={props.index === selectedIndex()}
                        onClick={setSelectedIndex}
                    />}
                </VirtualizedList>
                <Divider direction="vertical" yg:marginX={16} />
                <container
                    flexContainer
                    yg:flexDirection="column"
                    yg:alignItems="center"
                    yg:flexGrow={1}
                >
                    <container flexContainer yg:marginTop={8}>
                        <text
                            text={`#${selectedIndex() + 1}`}
                            style:fontSize={32}
                            alpha={0.25}
                            yg:marginRight={12}
                        />
                        <text
                            text={selectedItem().name}
                            style:fontSize={32}
                        />
                    </container>
                    <Divider direction="horizontal" yg:marginY={24} yg:width={200} />
                    <container flexContainer yg:width="100%">
                        <container
                            flexContainer
                            yg:flexDirection="column"
                            yg:alignItems="center"
                            yg:width="50%"
                        >
                            <text
                                text="Score"
                                alpha={0.25}
                                style:fontSize={32}
                                yg:marginY={4}
                            />
                            <text
                                text={selectedItem().score.toFixed()}
                                style:fontSize={32}
                                yg:marginY={4}
                            />
                        </container>
                        <container
                            flexContainer
                            yg:flexDirection="column"
                            yg:alignItems="center"
                            yg:width="50%"
                        >
                            <text
                                text="Time"
                                alpha={0.25}
                                style:fontSize={32}
                                yg:marginY={4}
                            />
                            <text
                                text={formatTime(selectedItem().duration)}
                                style:fontSize={32}
                                yg:marginY={4}
                            />
                        </container>
                    </container>
                    <Divider direction="horizontal" yg:marginY={24} yg:width={200} />
                    <container flexContainer>
                        <container
                            flexContainer
                            alpha={0.25}
                            yg:flexDirection="column"
                            yg:alignItems="flex-end"
                            yg:width="60%"
                            yg:marginRight={8}
                        >
                            <DetailItem text="Level Reached" />
                            <DetailItem text="Shots Fired" />
                            <DetailItem text="Accuracy" />
                            <DetailItem text="Asteroids Hit" />
                            <DetailItem text="Saucers Hit" />
                        </container>
                        <container
                            flexContainer
                            yg:flexDirection="column"
                            yg:width="40%"
                            yg:marginLeft={8}
                        >
                            <DetailItem text={selectedItem().level.toFixed()} />
                            <DetailItem text={selectedItem().shots.toFixed()} />
                            <DetailItem text={`${(selectedItem().accuracy * 100).toFixed(1)}%`} />
                            <DetailItem text={selectedItem().asteroids.toFixed()} />
                            <DetailItem text={selectedItem().ufos.toFixed()} />
                        </container>
                    </container>
                </container>
            </>;
        }}
        </Match>
    </Switch>;
};
