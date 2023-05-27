import { IRenderer, ISize } from "@pixi/core";
import { Container } from "@pixi/display";
import {
    AsteroidsGame,
    GameEvents,
    GameStatus,
    GameTokenResponse,
    InputProvider,
    InputProviderEvents,
    MAX_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
    TickFn,
    TickQueue,
    clamp,
    createRandom,
    createRandomSeed,
    decodeIntArray
} from "@wuspy/asteroids-core";
import {
    Accessor,
    ParentProps,
    Resource,
    batch,
    createContext,
    createEffect,
    createResource,
    createSignal,
    onCleanup,
    useContext
} from "solid-js";
import { GameTheme, getRandomTheme } from "./GameTheme";
import { getGameToken } from "./api";
import { controls, wasdMapping } from "./input";
import { TextStyleProvider } from "./solid-pixi";
import { FONT_STYLE } from "./ui";

export interface AppState {
    queue: TickQueue;
    stage: Container;
    renderer: IRenderer<HTMLCanvasElement>;
    container: HTMLElement;
    background: HTMLElement;
    dpr: number;
    scale: Accessor<number>;
    worldSize: Accessor<ISize>;
    game: AsteroidsGame;
    theme: Accessor<GameTheme>;
    input: InputProvider<typeof controls>;
    isQuit: Accessor<boolean>;
    isPaused: Accessor<boolean>;
    token: Accessor<GameTokenResponse | undefined>;
    nextToken: Resource<GameTokenResponse | undefined>;
}

export interface AppActions {
    pause(): void;
    resume(): void;
    start(): void;
    quit(): void;
    reset(): void;
}

export type AppAction =
    | "pause"
    | "resume"
    | "start"
    | "finished"
    | "quit"
    | "reset"
    | "resize"
    | "setNextTokenLoading"
    | {
        type: "setNextToken",
        token: GameTokenResponse | null,
    }

export const AppContext = createContext<AppState & AppActions>();

export const AppProvider = (
    props: ParentProps & Pick<AppState,
        | "queue"
        | "container"
        | "background"
        | "renderer"
        | "stage"
        | "dpr"
    >
) => {
    const game = new AsteroidsGame();
    const input = new InputProvider(controls, wasdMapping);
    const [theme, setTheme] = createSignal(getRandomTheme());
    const [isPaused, setPaused] = createSignal(false);
    const [isQuit, setQuit] = createSignal(false);
    const [token, setToken] = createSignal<GameTokenResponse>();
    // eslint-disable-next-line solid/reactivity
    const [scale, setScale] = createSignal(props.stage.scale.x);
    const [worldSize, setWorldSize] = createSignal({ ...game.worldSize });

    const [nextToken, { refetch: refetchNextToken }] = createResource(async () => {
        const response = await getGameToken();
        return response.ok ? response.data : undefined;
    });

    const pause = () => {
        if (game.state.status === GameStatus.Running) {
            setPaused(true);
        }
    };

    const resume = () => setPaused(false);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            pause();
        }
    });

    const performResize = () => {
        const [nativeWidth, nativeHeight] = [
            props.container.clientWidth * props.dpr,
            props.container.clientHeight * props.dpr,
        ];
        const aspectRatio = nativeWidth / nativeHeight;
        game.aspectRatio = clamp(aspectRatio, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO);
        // Scale world based on new screen size and aspect ratio
        if (aspectRatio > MAX_ASPECT_RATIO) {
            props.stage.scale.set(nativeHeight / game.worldSize.height);
            props.renderer.resize(nativeHeight * MAX_ASPECT_RATIO, nativeHeight);
        } else if (aspectRatio < MIN_ASPECT_RATIO) {
            props.stage.scale.set(nativeWidth / game.worldSize.width);
            props.renderer.resize(nativeWidth, nativeWidth / MIN_ASPECT_RATIO);
        } else {
            props.renderer.resize(nativeWidth, nativeHeight);
            props.stage.scale.set(nativeWidth / game.worldSize.width);
        }
        // Position view in center of screen
        props.renderer.view.style.top =
            `${Math.round((props.container.clientHeight - props.renderer.view.clientHeight) / 2)}px`;
        props.renderer.view.style.left =
            `${Math.round((props.container.clientWidth - props.renderer.view.clientWidth) / 2)}px`;
        // Resize background to view
        props.background.style.top = props.renderer.view.style.top;
        props.background.style.left = props.renderer.view.style.left;
        props.background.style.width = `${props.renderer.view.width}px`;
        props.background.style.height = `${props.renderer.view.height}px`;
        batch(() => {
            setScale(props.stage.scale.x);
            setWorldSize({ ...game.worldSize });
            pause();
        });
        if (process.env.NODE_ENV === "development") {
            console.log(
                `Aspect Ratio\t${aspectRatio.toPrecision(5)}\n` +
                `DPR\t\t${props.dpr.toPrecision(5)}\n` +
                `Stage\t\t{ x: ${props.renderer.view.width.toPrecision(5)}, y: ${props.renderer.view.height.toPrecision(5)} }\n` +
                `Game\t\t{ x: ${game.worldSize.width.toPrecision(5)}, y: ${game.worldSize.height.toPrecision(5)} }\n` +
                `Scale\t\t{ x: ${props.stage.scale.x.toPrecision(5)}, y: ${props.stage.scale.y.toPrecision(5)} }`
            );
        }
    };

    // eslint-disable-next-line solid/reactivity
    performResize();
    window.addEventListener("resize", performResize);

    const start = () => {
        if (game.state.status === GameStatus.Init && !nextToken.loading) {
            if (nextToken()) {
                try {
                    game.random = createRandom(decodeIntArray(nextToken()!.randomSeed));
                    setToken(nextToken());
                    game.enableLogging = true;
                } catch (e) {
                    console.error("Failed to seed random from token");
                    setToken(undefined);
                    game.random = createRandom(createRandomSeed());
                    game.enableLogging = false;
                }
            } else {
                setToken(undefined);
                game.random = createRandom(createRandomSeed());
                game.enableLogging = false;
            }
            refetchNextToken();
            game.start();
        }
    };

    const reset = () => {
        game.reset();
        batch(() => {
            setPaused(false);
            setQuit(false);
            setToken(undefined);
            setTheme(getRandomTheme());
        });
    };

    const value = {
        ...props,
        game,
        input,
        theme,
        scale,
        worldSize,
        token,
        nextToken,
        isPaused,
        pause,
        resume,
        isQuit,
        quit: () => setQuit(true),
        start,
        reset,
    };

    return (
        <AppContext.Provider value={value}>
            <TextStyleProvider {...FONT_STYLE}>
                {props.children}
            </TextStyleProvider>
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext)!;

const TICK_PRIORITY = 100;
const trueFn: () => any = () => true;

export const onTick = (type: "app" | "game", callback: TickFn, enabled = trueFn) => {
    const app = useApp();
    const queue = type === "app" ? app.queue : app.game.queue;
    let registered = false;

    createEffect(() => {
        if (!!enabled() !== registered) {
            registered = !!enabled();
            registered ? queue.add(TICK_PRIORITY, callback) : queue.remove(callback);
        }
    });

    onCleanup(() => registered && queue.remove(callback));
};

export const onGameEvent = <K extends keyof GameEvents>(
    event: K,
    callback: GameEvents[K],
    enabled = trueFn
) => {
    const { game } = useApp();
    let registered = false;

    createEffect(() => {
        if (!!enabled() !== registered) {
            registered = !!enabled();
            registered ? game.events.on(event, callback) : game.events.off(event, callback);
        }
    });

    onCleanup(() => registered && game.events.off(event, callback));
};

export const onInputEvent = <K extends keyof InputProviderEvents<typeof controls>>(
    event: K,
    callback: InputProviderEvents<typeof controls>[K],
    enabled = trueFn,
) => {
    const { input } = useApp();
    let registered = false;

    createEffect(() => {
        if (!!enabled() !== registered) {
            registered = !!enabled();
            registered ? input.events.on(event, callback) : input.events.off(event, callback);
        }
    });

    onCleanup(() => registered && input.events.off(event, callback));
};
