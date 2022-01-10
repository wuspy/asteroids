export interface Tickable {
    tick(timestamp: number, elapsed: number): void;
}

export class TickQueue implements Tickable {
    private _priorities: number[];
    private _items: Partial<{ [Key: number]: Tickable[] }>;

    constructor() {
        this._items = [];
        this._priorities = [];
    }

    add(priority: number, ...items: Tickable[]) {
        if (this._items[priority]) {
            this._items[priority]!.push(...items);
        } else {
            this._items[priority] = items;
            this.insertPriority(priority);
        }
    }

    remove(priority: number, ...items: Tickable[]) {
        if (!this._items[priority]) {
            return;
        }
        for (const item of items) {
            const i = this._items[priority]!.indexOf(item);
            if (i !== -1) {
                this._items[priority]!.splice(i, 1);
            }
        }
    }

    tick(timestamp: number, elapsed: number): void {
        this._priorities.forEach((priority) => this._items[priority]!.forEach((item) => item.tick(timestamp, elapsed)));
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
