export interface Tickable {
    tick(timestamp: number, elapsed: number): void;
}

export class TickQueue implements Tickable {
    private _priorities: number[];
    private _items: Partial<{ [Key: number]: Tickable[] }>;
    name: string;

    constructor(name: string) {
        this.name = name;
        this._items = [];
        this._priorities = [];
    }

    add(priority: number, ...items: Tickable[]): void {
        if (this._items[priority]) {
            this._items[priority]!.push(...items);
        } else {
            this._items[priority] = items;
            this.insertPriority(priority);
        }
        if (process.env.NODE_ENV === "development") {
            console.log(`[TickQueue ${this.name}] ${this.length} items (add)`);
        }
    }

    remove(priority: number, ...items: Tickable[]): void {
        if (!this._items[priority]) {
            return;
        }
        for (const item of items) {
            const i = this._items[priority]!.indexOf(item);
            if (i !== -1) {
                this._items[priority]!.splice(i, 1);
            }
        }
        if (process.env.NODE_ENV === "development") {
            console.log(`[TickQueue ${this.name}] ${this.length} items (remove)`);
        }
    }

    clear(): void {
        this._items = [];
        this._priorities = [];
        if (process.env.NODE_ENV === "development") {
            console.log(`[TickQueue ${this.name}] 0 items (clear)`);
        }
    }

    tick(timestamp: number, elapsed: number): void {
        this._priorities.forEach((priority) => this._items[priority]!.forEach((item) => item.tick(timestamp, elapsed)));
    }

    get length(): number {
        return this._priorities.reduce((count, priority) => count + this._items[priority]!.length, 0);
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
