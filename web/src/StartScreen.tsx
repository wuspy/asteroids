import { Container } from "@pixi/display";
import { FederatedPointerEvent } from "@pixi/events";
import { EventManager, GameStatus, Projectile, Ship, TickQueue, WrapMode } from "@wuspy/asteroids-core";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { AboutMeModal } from "./AboutMeModal";
import { onGameEvent, onInputEvent, onTick, useApp } from "./AppContext";
import { LeaderboardModal } from "./LeaderboardModal";
import { StartControl } from "./StartControl";
import { ShipSprite } from "./gameplay";
import { ContainerProps } from "./solid-pixi";
import { Button, ControlDescription, ControlDescriptionProps, FadeContainer, Pointer, PointerProps } from "./ui";
import anime, { AnimeInstance } from "animejs";
import { FlexDirection } from "./yoga-pixi";
import { ProjectileSprite } from "./gameplay/ProjectileSprite";

const delayBetweenControls = 120;

class StartScreenShip extends Ship {
    public constructor(queue: TickQueue) {
        super({
            state: {
                level: 1,
                score: 0,
                lives: 1,
                status: GameStatus.Running,
                timestamp: 0,
                asteroids: [],
                projectiles: [],
                ufos: [],
            },
            events: new EventManager(),
            queue,
            worldSize: {width: 200, height: 200},
            random: () => 0, // Always hyperspace to [0, 0]
            invulnerable: false,
            position: {x: 0, y: 0}
        });
        this.wrapMode = WrapMode.None;
    }
}

export const StartScreen = (props: ContainerProps) => {
    const { game, theme, nextToken, start, queue } = useApp();

    const [started, setStarted] = createSignal(game.state.status !== GameStatus.Init);
    const [visible, setVisible] = createSignal(false);
    const [bottomControlsVisible, setBottomControlsVisible] = createSignal(false);
    const [leaderboardOpen, setLeaderboardOpen] = createSignal(false);
    const [aboutOpen, setAboutOpen] = createSignal(false);
    const [fadeInDelay, setFadeInDelay] = createSignal(500);
    const [projectiles, setProjectiles] = createSignal<Projectile[]>([]);
    const [ship, setShip] = createSignal<StartScreenShip>();

    // const ship = new StartScreenShip(queue);

    let mainContainer!: Container;
    let shipSprite!: Container;
    let shipAnim: AnimeInstance | undefined;
    let shipContainer!: Container;

    createEffect(() => {
        if (started()) {
            setVisible(false);
            if (ship()) {
                for (const projectile of projectiles()) {
                    projectile.destroy({hit: false});
                }
                setProjectiles([]);
                ship()!.destroy({ hit: false });
                setShip(undefined);
            }
            shipAnim = undefined;
         } else {
            const ship = new StartScreenShip(queue);
            ship.state.ship = ship;
            ship.events.on("projectileCreated", (projectile) => {
                projectile.wrapMode = WrapMode.None;
                ship.state.projectiles.push(projectile);
                setProjectiles([...ship.state.projectiles]);
            });
            ship.events.on("projectileDestroyed", (projectile) => {
                ship.state.projectiles.splice(ship.state.projectiles.indexOf(projectile), 1);
                setProjectiles([...ship.state.projectiles]);
            });
            setShip(ship);
            show(true);
         }
    });
    onGameEvent("started", () => setStarted(true));
    onGameEvent("reset", () => setStarted(false));

    const onStart = () => {
        if (!nextToken.loading) {
            setVisible(false)
            setTimeout(start, 1000);
        }
    };

    const onStartClick = (e: FederatedPointerEvent) => e.button === 0 && onStart();

    // eslint-disable-next-line solid/reactivity
    onInputEvent("poll", (state, lastState) => {
        const _ship = ship()!;
        if (state.thrust) {
            _ship.accelerationAmount = state.thrust;
            _ship.velocity.y -= _ship.position.y;
            _ship.velocity.x -= _ship.position.x;
            shipAnim = undefined;
        } else if ((_ship.position.x !== 0 || _ship.position.y !== 0) && !shipAnim) {
            _ship.accelerationAmount = 0;
            _ship.acceleration = 0;
            _ship.velocity.x = 0;
            _ship.velocity.y = 0;
            shipAnim = anime({
                autoplay: false,
                targets: _ship.position,
                x: 0,
                y: 0,
                easing: "spring(1, 50, 10, 0)",
                complete: () => {
                    shipAnim = undefined;
                },
            });
        }

        if (state.turn) {
            if (Math.sign(_ship.rotation) !== Math.sign(state.turn) || Math.abs(_ship.rotation) < 0.2) {
                _ship.rotationAmount = state.turn;
            } else {
                _ship.rotationAmount = 0;
                _ship.rotationAcceleration = 0;
            }
        } else if (Math.abs(_ship.rotation) > 0.005) {
            _ship.rotationAmount = -_ship.rotation * 2;
        } else {
            _ship.rotation = _ship.rotationAmount = 0;
        }

        if (state.hyperspace && !lastState.hyperspace) {
            _ship.hyperspace();
        }

        if (state.fire && !lastState.fire) {
            _ship.fire();
            // shipAnim = undefined;
        }

        if (state.start && !lastState.start) {
            onStart();
        }
    }, visible);

    // eslint-disable-next-line solid/reactivity
    onTick("app", (timestamp) => {
        ship()!.state.timestamp = timestamp;
        shipAnim?.tick(timestamp);
    }, visible);

    const show = (withDelay: boolean) => {
        setFadeInDelay(withDelay ? 500 : 0);
        setVisible(true);
        if (withDelay) {
            setBottomControlsVisible(false);
            setTimeout(() => setBottomControlsVisible(true), 1500);
        } else {
            setBottomControlsVisible(true);
        }
    };

    const onAboutClick = () => {
        setAboutOpen(true);
        setVisible(false);
    };
    const onAboutClose = () => {
        setAboutOpen(false);
        show(false);
    };
    const onLeaderboardClick = () => {
        setLeaderboardOpen(true);
        setVisible(false);
    };
    const onLeaderboardClose = () => {
        setLeaderboardOpen(false);
        show(false);
    };

    type ControlPointerProps =
        Pick<PointerProps, "attachment" | "angle">
        & Pick<ControlDescriptionProps, "control" | "analogValue">
        & { label: string, fadeSequence: number }

    const ShipControlPointer = (props: ControlPointerProps) => {
        const labelAndDirection = createMemo<{
            beforeLabel?: string,
            afterLabel?: string,
            direction: FlexDirection,
        }>(() => {
            if (props.angle < 45) { // bottom attachment
                return {beforeLabel: props.label, direction: "column"};
            } else if (props.angle < 135) { // left attachment
                return {afterLabel: props.label, direction: "row"};
            } else if (props.angle < 225) { // top attachment
                return {afterLabel: props.label, direction: "column"};
            } else { // right attachment
                return {beforeLabel: props.label, direction: "row"};
            }
        });

        const control = <ControlDescription
            color={theme().foregroundColor}
            size={24}
            control={props.control}
            analogValue={props.analogValue}
            {...labelAndDirection()}
        />;

        return <Pointer
            target={shipSprite}
            attachment={props.attachment}
            angle={props.angle}
            length={50}
            delay={fadeInDelay() + props.fadeSequence * delayBetweenControls}
            revealed={visible()}
            color={theme().foregroundColor}
        >
            {control}
        </Pointer>;
    };

    return <>
        <FadeContainer
            {...props}
            ref={mainContainer}
            visible={visible()}
            keepMounted={!started()}
            fadeInDuration={500}
            fadeOutDuration={500}
            yogaContainer
            yg:alignItems="center"
            yg:justifyContent="center"
        >
            <container
                ref={shipContainer}
                alpha={theme().foregroundAlpha}
                skew={[-0.02, 0.02]}
                yg:position="absolute"
                yg:anchor={0.5}
                sortableChildren
            >
                <For each={projectiles()}>{projectile =>
                    <ProjectileSprite projectile={projectile} effectsContainer={shipContainer} />}
                </For>
                <Show when={ship()}>{ship => <>
                    <ShipSprite
                        ref={(ref) => shipSprite = ref}
                        effectsContainer={shipContainer}
                        ship={ship()}
                    />
                    <ShipControlPointer
                        attachment={[0, -45]}
                        angle={0}
                        fadeSequence={0}
                        control="fire"
                        label="Fire"
                    />
                    <ShipControlPointer
                        attachment={[25, -10]}
                        angle={70}
                        fadeSequence={1}
                        control="turn"
                        analogValue={1}
                        label="Turn Right"
                    />
                    <ShipControlPointer
                        attachment={[35, 40]}
                        angle={120}
                        fadeSequence={2}
                        control="hyperspace"
                        label="Hyperspace"
                    />
                    <ShipControlPointer
                        attachment={[0, 45]}
                        angle={180}
                        fadeSequence={3}
                        control="thrust"
                        label="Thrust"
                    />
                    <ShipControlPointer
                        attachment={[-35, 40]}
                        angle={240}
                        fadeSequence={4}
                        control="start"
                        label="Pause"
                    />
                    <ShipControlPointer
                        attachment={[-25, -10]}
                        angle={290}
                        fadeSequence={4}
                        control="turn"
                        analogValue={-1}
                        label="Turn Left"
                    /></>}
                </Show>
            </container>
            <FadeContainer
                fadeInDuration={500}
                fadeOutDuration={0}
                keepMounted
                keepPixiVisible
                visible={bottomControlsVisible()}
                blur={0}
                filterPadding={24}
                skew={[-0.02, 0.02]}
                yogaContainer
                yg:flexDirection="column"
                yg:alignItems="center"
                yg:top={235}
            >
                <StartControl
                    type="start"
                    color={theme().foregroundColor}
                    alpha={theme().foregroundAlpha}
                    yg:margin={24}
                    on:pointertap={onStartClick}
                />
                <container yogaContainer yg:flexDirection="column" yg:alignItems="center">
                    <container yogaContainer yg:gap={24}>
                        <Button
                            text="About Me"
                            type="secondary"
                            onClick={onAboutClick}
                        />
                        <Show when={nextToken()}>
                            <Button
                                text="Leaderboard"
                                type="secondary"
                                onClick={onLeaderboardClick}
                            />
                        </Show>
                    </container>
                </container>
            </FadeContainer>
        </FadeContainer>
        <LeaderboardModal open={leaderboardOpen()} onClose={onLeaderboardClose} />
        <AboutMeModal open={aboutOpen()} onClose={onAboutClose} />
    </>;
};
