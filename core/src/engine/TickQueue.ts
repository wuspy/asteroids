export type TickFn = (timestamp: number, elapsed: number) => void;

export class TickQueue {
    private _priorities: number[];
    private _items: Partial<{ [Key: number]: [TickFn, any][] }>;

    constructor() {
        this._items = [];
        this._priorities = [];
    }

    add(priority: number, callback: TickFn, thisArg: any = undefined): void {
        const loc = this.findItem(callback, thisArg);
        if (loc) {
            if (loc[0] === priority) {
                console.warn("TickQueue.add: handler already in queue at same priority", callback, thisArg);
                return;
            } else {
                console.warn(`TickQueue.add: moving existing handler from priority ${loc[0]} to ${priority}`, callback, thisArg);
                this._items[loc[0]]!.splice(loc[1], 1);
            }
        }
        if (this._items[priority]) {
            this._items[priority]!.push([callback, thisArg]);
        } else {
            this._items[priority] = [[callback, thisArg]];
            this.insertPriority(priority);
        }
    }

    remove(callback: TickFn, thisArg: any = undefined): void {
        const loc = this.findItem(callback, thisArg);
        if (loc) {
            this._items[loc[0]]!.splice(loc[1], 1);
        } else {
            console.warn("TickQueue.remove: handler was not in queue", callback, thisArg);
        }
    }

    clear(): void {
        this._items = [];
        this._priorities = [];
    }

    tick(timestamp: number, elapsed: number): void {
        this._priorities.forEach(priority =>
            this._items[priority]!.forEach(
                ([cb, ta]) => cb.call(ta, timestamp, elapsed)
            )
        );
    }

    get length(): number {
        return this._priorities.reduce((count, priority) => count + this._items[priority]!.length, 0);
    }

    private findItem(item: TickFn, thisArg: any): [number, number] | undefined {
        let i;
        for (const priority of this._priorities) {
            i = this._items[priority]!.findIndex(([cb, ta]) => cb === item && ta === thisArg);
            if (i !== -1) {
                return [priority, i];
            }
        }
        return undefined;
    }

    private insertPriority(priority: number): void {
        let [l, r] = [0, this._priorities.length - 1];
        if (r < l) {
            // Priorities is empty
            this._priorities = [priority];
        } else {
            let i = 0;
            while (l <= r) {
                i = Math.floor((l + r) / 2);
                if (this._priorities[i] < priority) {
                    l = i + 1;
                } else if (this._priorities[i] > priority) {
                    r = i - 1;
                } else {
                    return;
                }
            }
            this._priorities.splice(this._priorities[i] < priority ? i + 1 : i, 0, priority);
        }
    }
}
