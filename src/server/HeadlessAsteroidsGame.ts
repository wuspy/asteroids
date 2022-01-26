import { CoreAsteroidsGame, inputLogConfig } from "@core";
import { seedRandom, parseGameLog } from "@core/engine";

export class HeadlessAsteroidsGame extends CoreAsteroidsGame {
    private _log: string;
    private _didParserComplete: boolean;
    private _parseError?: any;

    constructor(params: { log: string, randomSeed: string }) {
        if (!seedRandom(params.randomSeed)) {
            throw new Error("Failed to seed random");
        }
        super();
        this._log = params.log;
        this._didParserComplete = false;
    }

    run() {
        if (this.state.status !== "init") {
            throw new Error("Game has already been run");
        }
        try {
            const parser = parseGameLog(this._log, inputLogConfig);
            let frame = parser.next();
            if (frame.done) {
                throw new Error("Log is empty");
            }
            const [elapsed, worldSize] = frame.value;
            if (elapsed !== 0 || worldSize.width === 0 || worldSize.height === 0) {
                throw new Error("Log has invalid header");
            }
            this.worldSize.width = worldSize.width;
            this.worldSize.height = worldSize.height;

            this.start();

            frame = parser.next();
            while (!frame.done) {
                const [elapsed, worldSize, input, position] = frame.value;
                this.worldSize.width = worldSize.width;
                this.worldSize.height = worldSize.height;
                if (elapsed === 0 || worldSize.width === 0 || worldSize.height === 0) {
                    throw new Error(`Invalid frame at position ${position}: ${elapsed} ${worldSize.width} ${worldSize.height}`);
                }
                this.tick(elapsed, input);
                frame = parser.next();
                // @ts-ignore For some reason ts doesn't realize this.state.status can be modified by this.tick
                if (this.state.status === "finished") {
                    break;
                }
            }
            this._didParserComplete = !!frame.done;
        } catch (e) {
            this._parseError = e;
        }
    }

    get didParserComplete(): boolean {
        return this._didParserComplete;
    }

    get parseError(): any {
        return this._parseError;
    }
}
