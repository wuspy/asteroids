import {
    AsteroidsGame,
    clamp,
    createRandom,
    createRandomSeed,
    decodeIntArray,
    GameEvents,
    GameStatus,
    GameTokenResponse,
    InputProvider,
    InputProviderEvents,
    MAX_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
    TickFn,
    TickQueue
} from "@wuspy/asteroids-core";
import { IRenderer } from "@pixi/core";
import { Container } from "@pixi/display";
import { createContext, Dispatch, ReactNode, Reducer, useContext, useEffect, useLayoutEffect, useReducer, useRef } from "react";
import { getGameToken } from "./api";
import { GameTheme, getRandomTheme } from "./GameTheme";
import { controls, wasdMapping } from "./input";

export interface AppState {
    queue: TickQueue;
    stage: Container;
    renderer: IRenderer<HTMLCanvasElement>;
    container: HTMLElement;
    background: HTMLElement;
    dpr: number;
    game: AsteroidsGame;
    theme: GameTheme;
    input: InputProvider<typeof controls>;
    quit: boolean;
    paused: boolean;
    token: GameTokenResponse | null;
    nextToken: GameTokenResponse | null;
    nextTokenLoading: boolean;
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

const performResize = (state: AppState): void => {
    const { game, container, background, renderer, stage, dpr } = state;
    const [nativeWidth, nativeHeight] = [
        container.clientWidth * dpr,
        container.clientHeight * dpr,
    ];
    const aspectRatio = nativeWidth / nativeHeight;
    game.aspectRatio = clamp(aspectRatio, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO);
    // Scale world based on new screen size and aspect ratio
    if (aspectRatio > MAX_ASPECT_RATIO) {
        stage.scale.set(nativeHeight / game.worldSize.height);
        renderer.resize(nativeHeight * MAX_ASPECT_RATIO, nativeHeight);
    } else if (aspectRatio < MIN_ASPECT_RATIO) {
        stage.scale.set(nativeWidth / game.worldSize.width);
        renderer.resize(nativeWidth, nativeWidth / MIN_ASPECT_RATIO);
    } else {
        renderer.resize(nativeWidth, nativeHeight);
        stage.scale.set(nativeWidth / game.worldSize.width);
    }
    // Position view in center of screen
    renderer.view.style.top = `${Math.round((container.clientHeight - renderer.view.clientHeight) / 2)}px`;
    renderer.view.style.left = `${Math.round((container.clientWidth - renderer.view.clientWidth) / 2)}px`;
    // Resize background to view
    background.style.top = renderer.view.style.top;
    background.style.left = renderer.view.style.left;
    background.style.width = `${renderer.view.width}px`;
    background.style.height = `${renderer.view.height}px`;
    if (process.env.NODE_ENV === "development") {
        console.log(
            `Aspect Ratio\t${aspectRatio.toPrecision(5)}\n` +
            `DPR\t\t${dpr.toPrecision(5)}\n` +
            `Stage\t\t{ x: ${renderer.view.width.toPrecision(5)}, y: ${renderer.view.height.toPrecision(5)} }\n` +
            `Game\t\t{ x: ${game.worldSize.width.toPrecision(5)}, y: ${game.worldSize.height.toPrecision(5)} }\n` +
            `Scale\t\t{ x: ${stage.scale.x.toPrecision(5)}, y: ${stage.scale.y.toPrecision(5)} }`
        );
    }
};

export type ThunkAction = (
    dispatch: Reducer<AppState, AppAction>,
    state: AppState,
) => void;

const reducer: Reducer<AppState, AppAction> = (state, action): AppState => {
    if (typeof action === "string") {
        switch (action) {
            case "start":
                if (state.game.state.status === GameStatus.Init && !state.nextTokenLoading) {
                    if (state.nextToken) {
                        try {
                            state.game.random = createRandom(decodeIntArray(state.nextToken.randomSeed));
                            state.game.enableLogging = true;
                        } catch (e) {
                            console.error("Failed to seed random from token");
                            state.game.random = createRandom(createRandomSeed());
                            state.game.enableLogging = false;
                        }
                    } else {
                        state.game.random = createRandom(createRandomSeed());
                        state.game.enableLogging = false;
                    }
                    state.game.start();
                    return {
                        ...state,
                        token: state.nextToken,
                        nextToken: null,
                    };
                } else {
                    return state;
                }
            case "pause":
                if (!state.paused && state.game.state.status === GameStatus.Running) {
                    return { ...state, paused: true };
                } else {
                    return state;
                }
            case "resume":
                if (state.paused) {
                    return { ...state, paused: false };
                } else {
                    return state;
                }
            case "finished":
                return { ...state };
            case "quit":
                return { ...state, quit: true };
            case "reset":
                state.game.reset();
                return {
                    ...state,
                    paused: false,
                    quit: false,
                    token: null,
                    theme: getRandomTheme(),
                }
            case "resize":
                performResize(state);
                return { ...state, ...reducer(state, "pause") };
            case "setNextTokenLoading":
                return { ...state, nextTokenLoading: true };
        }
    } else {
        switch (action.type) {
            case "setNextToken":
                return {
                    ...state,
                    nextTokenLoading: false,
                    nextToken: action.token,
                };
        }
    }
};

export const AppContext = createContext<AppState & { dispatch: Dispatch<AppAction> } | undefined>(undefined);

export interface AppProviderProps {
    value: Pick<AppState,
        | "queue"
        | "container"
        | "background"
        | "renderer"
        | "stage"
        | "dpr"
    >;
    children: ReactNode;
}

export const AppProvider = ({ children, value }: AppProviderProps) => {
    const [state, dispatch] = useReducer(reducer, value, (state) => {
        const fullState: AppState = {
            ...state,
            game: new AsteroidsGame(),
            input: new InputProvider(controls, wasdMapping),
            theme: getRandomTheme(),
            paused: false,
            quit: false,
            token: null,
            nextToken: null,
            nextTokenLoading: true,
        };
        performResize(fullState);
        return fullState;
    });

    useEffect(() => {
        const onFinished = () => dispatch("finished");
        state.game.events.on("finished", onFinished);
        return () => state.game.events.off("finished", onFinished);
    }, [state.game.events]);

    useEffect(() => {
        const onResize = () => dispatch("resize");
        window.addEventListener("resize", onResize);

        const onVisibilityChange = () => {
            if (document.hidden) {
                dispatch("pause");
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!state.nextToken) {
            dispatch("setNextTokenLoading");
            getGameToken().then((response) => {
                if (response.ok) {
                    dispatch({ type: "setNextToken", token: response.data });
                } else {
                    dispatch({ type: "setNextToken", token: null });
                }
            });
        }
    }, [state.nextToken]);

    return (
        <AppContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext)!;

export const useTickQueue = (type: "app" | "game") => {
    const app = useApp();
    return type === "app" ? app.queue : app.game.queue;
};

const TICK_PRIORITY = 100;

export const useTick = (type: "app" | "game", callback: (timestamp: number, elapsed: number) => void, enabled = true) => {
    const queue = useTickQueue(type);
    const ref = useRef(callback);

    // These must be layout effects because if a subscriber mutates a ref in the callback, they should be
    // unsubscribed from the tick before the ref is cleared.
    useLayoutEffect(() => {
        ref.current = callback;
    }, [callback]);

    useLayoutEffect(() => {
        if (enabled) {
            const dispatch: TickFn = (timestamp, elapsed) => ref.current!(timestamp, elapsed);
            queue.add(TICK_PRIORITY, dispatch)
            return () => queue.remove(dispatch);
        }
    }, [queue, enabled]);
};

export const useGameEvent = <K extends keyof GameEvents>(event: K, callback: GameEvents[K], enabled = true) => {
    const { game } = useApp();
    const ref = useRef(callback);

    // These must be layout effects because if a subscriber mutates a ref in the callback, they should be
    // unsubscribed from the event before the ref is cleared.
    useLayoutEffect(() => {
        ref.current = callback;
    }, [callback]);

    useLayoutEffect(() => {
        if (enabled) {
            const dispatch: typeof callback = (...args: any[]) => (ref.current as any)!(...args);
            game.events.on(event, dispatch);
            return () => game.events.off(event, dispatch);
        }
    }, [game, event, enabled]);
};

export const useInputEvent = <K extends keyof InputProviderEvents<typeof controls>>(
    event: K,
    callback: InputProviderEvents<typeof controls>[K],
    enabled = true,
) => {
    const { input } = useApp();
    const ref = useRef(callback);

    // These must be layout effects because if a subscriber mutates a ref in the callback, they should be
    // unsubscribed from the event before the ref is cleared.
    useLayoutEffect(() => {
        ref.current = callback;
    }, [callback]);

    useLayoutEffect(() => {
        if (enabled) {
            const dispatch: typeof callback = (...args: any[]) => (ref.current as any)!(...args);
            input.events.on(event, dispatch);
            return () => input.events.off(event, dispatch);
        }
    }, [input, event, enabled]);
};
