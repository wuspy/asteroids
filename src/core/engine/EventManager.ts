export type EventMap<Name extends string | number | symbol> = { [Key in Name]: (...args: any) => void };

export class EventManager<Events extends EventMap<keyof Events>> {
    private _callbacks: { [Name in keyof Events]?: [Events[Name], any][] };

    constructor() {
        this._callbacks = { };
    }

    on<K extends keyof Events>(event: K, callback: Events[K], thisArg: any = undefined): void {
        if (!this._callbacks[event]) {
            this._callbacks[event] = [[callback, thisArg]];
        } else {
            this._callbacks[event]!.push([callback, thisArg]);
        }
    }

    off<K extends keyof Events>(event: K, callback: Events[K], thisArg: any = undefined): void {
        if (this._callbacks[event]) {
            this._callbacks[event] = this._callbacks[event]!.filter(([cb, ta]) => cb !== callback || ta !== thisArg);
        }
    }

    offThis(thisArg: any) {
        for (const event in this._callbacks) {
            this._callbacks[event] = this._callbacks[event]!.filter(([, ta]) => ta !== thisArg);
        }
    }

    trigger<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
        this._callbacks[event]?.forEach(([cb, ta]) => cb.call(ta, ...args));
    }
}
