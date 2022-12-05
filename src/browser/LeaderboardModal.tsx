import { useLayoutEffect, useState } from "react";
import { HighScoreResponse } from "../core/api";
import { ApiErrorType, ApiResponse, getHighScores } from "./api";
import { useApp } from "./AppContext";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { LeaderboardListItem, LEADERBOARD_LIST_ITEM_HEIGHT } from "./LeaderboardListItem";
import { Container, Text } from "./react-pixi";
import { Divider, DividerDirection, FONT_STYLE, LoadingAnimation, Modal, ModalCloseButton, UI_FOREGROUND_COLOR, VirtualizedList } from "./ui";

interface PlaceholderProps {
    loading: boolean;
    message: string;
}

const Placeholder = ({ loading, message }: PlaceholderProps) =>
    <Container flexContainer layoutStyle={{
        flexDirection: FlexDirection.Column,
        position: PositionType.Absolute,
        alignItems: Align.Center,
        justifyContent: JustifyContent.Center,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }}>
        {loading && <LoadingAnimation diameter={120} color={UI_FOREGROUND_COLOR} layoutStyle={{ marginY: 12 }} />}
        <Text
            text={message}
            style={{ ...FONT_STYLE, fontSize: 20, wordWrap: true, align: "center" }}
            layoutStyle={{ marginY: 12 }}
        />
    </Container>;

const DetailItem = ({ text }: { text: string }) =>
    <Text text={text} style={{ ...FONT_STYLE, fontSize: 20 }} layoutStyle={{ marginY: 4 }} />

const formatTime = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    return `${Math.floor(seconds / 60).toFixed(0)}m ${(seconds % 60).toFixed(0)}s`;
};

export const LeaderboardModal = () => {
    const { leaderboardOpen, renderer, dispatch } = useApp();
    const [items, setItems] = useState<ApiResponse<HighScoreResponse[]> | "loading">();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const onClose = () => dispatch("closeLeaderboard");

    const isLoaded = typeof items === "object" && items.ok;
    const isError = typeof items === "object" && !items.ok;

    useLayoutEffect(() => {
        let isMounted = true;

        if (leaderboardOpen) {
            if (!isLoaded) {
                setItems("loading");
                getHighScores().then(response => isMounted && setItems(response));
            }
        } else if (items) {
            setTimeout(() => {
                if (isMounted) {
                    setSelectedIndex(0);
                    setItems(undefined);
                }
            }, isLoaded ? 5000 : 200);
        }

        return () => {
            isMounted = false;
        };
    }, [leaderboardOpen, isLoaded]);

    let content;
    if (isLoaded && items.data.length) {
        const itemRenderer = (data: HighScoreResponse, index: number) =>
            <LeaderboardListItem
                key={data.id}
                data={data}
                index={index}
                selected={index === selectedIndex}
                onClick={setSelectedIndex}
            />;

        const selectedItem = items.data[selectedIndex];

        content = <>
            <VirtualizedList
                data={items.data}
                itemRenderer={itemRenderer}
                overscroll={12}
                itemHeight={LEADERBOARD_LIST_ITEM_HEIGHT}
                interactionManager={renderer.plugins.interaction}
                layoutStyle={{
                    width: 400,
                    height: "100%",
                    flexShrink: 0,
                }}
            />
            <Divider margin={16} direction={DividerDirection.Vertical} />
            <Container
                flexContainer
                layoutStyle={{
                    flexDirection: FlexDirection.Column,
                    alignItems: Align.Center,
                    flexGrow: 1,
                }}>
                <Container flexContainer layoutStyle={{ marginTop: 8 }}>
                    <Text
                        text={`#${selectedIndex + 1}`}
                        style={{ ...FONT_STYLE, fontSize: 32 }}
                        alpha={0.25}
                        layoutStyle={{ marginRight: 12 }}
                    />
                    <Text
                        text={selectedItem.name}
                        style={{ ...FONT_STYLE, fontSize: 32 }}
                    />
                </Container>
                <Divider margin={24} direction={DividerDirection.Horizontal} layoutStyle={{ width: 200 }} />
                <Container flexContainer layoutStyle={{ width: "100%" }}>
                    <Container flexContainer layoutStyle={{
                        flexDirection: FlexDirection.Column,
                        alignItems: Align.Center,
                        width: "50%",
                    }}>
                        <Text
                            text="Score"
                            alpha={0.25}
                            style={{ ...FONT_STYLE, fontSize: 32 }}
                            layoutStyle={{ marginY: 4 }}
                        />
                        <Text
                            text={selectedItem.score.toFixed()}
                            style={{ ...FONT_STYLE, fontSize: 32 }}
                            layoutStyle={{ marginY: 4 }}
                        />
                    </Container>
                    <Container flexContainer layoutStyle={{
                        flexDirection: FlexDirection.Column,
                        alignItems: Align.Center,
                        width: "50%",
                    }}>
                        <Text
                            text="Time"
                            alpha={0.25}
                            style={{ ...FONT_STYLE, fontSize: 32 }}
                            layoutStyle={{ marginY: 4 }}
                        />
                        <Text
                            text={formatTime(selectedItem.duration)}
                            style={{ ...FONT_STYLE, fontSize: 32 }}
                            layoutStyle={{ marginY: 4 }}
                        />
                    </Container>
                </Container>
                <Divider margin={24} direction={DividerDirection.Horizontal} layoutStyle={{ width: 200 }} />
                <Container flexContainer>
                    <Container flexContainer alpha={0.25} layoutStyle={{
                        flexDirection: FlexDirection.Column,
                        alignItems: Align.FlexEnd,
                        width: "60%",
                        marginRight: 8,
                    }}>
                        <DetailItem text="Level Reached" />
                        <DetailItem text="Shots Fired" />
                        <DetailItem text="Accuracy" />
                        <DetailItem text="Asteroids Hit" />
                        <DetailItem text="Saucers Hit" />
                    </Container>
                    <Container flexContainer layoutStyle={{
                        flexDirection: FlexDirection.Column,
                        width: "40%",
                        marginLeft: 8,
                    }}>
                        <DetailItem text={selectedItem.level.toFixed()} />
                        <DetailItem text={selectedItem.shots.toFixed()} />
                        <DetailItem text={`${(selectedItem.accuracy * 100).toFixed(1)}%`} />
                        <DetailItem text={selectedItem.asteroids.toFixed()} />
                        <DetailItem text={selectedItem.ufos.toFixed()} />
                    </Container>
                </Container>
            </Container>
        </>;
    } else if (isLoaded && !items.data.length) {
        content = <Placeholder loading message="There's nothing here." />;
    } else if (isError) {
        const message = items.error === ApiErrorType.ApiError
            ? items.message
            : "Error contacting server. Try again later.";
        content = <Placeholder loading={false} message={message} />;
    } else if (items === "loading") {
        content = <Placeholder loading message="Connecting to mainframe..." />;
    }

    return (
        <Modal open={leaderboardOpen}
            headerTitle="Leaderboard"
            headerRightContent={<ModalCloseButton onClick={onClose} />}
        >
            <Container flexContainer layoutStyle={{ width: 800, height: 390 }}>
                {content}
            </Container>
        </Modal>
    );
};
