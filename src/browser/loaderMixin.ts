import { Loader } from "@pixi/loaders";

declare module "@pixi/loaders"
{
    interface Loader {
        promise(): Promise<Loader>;
    }
}

const loader = Loader.prototype;

loader.promise = function(this: Loader): Promise<Loader> {
    return new Promise((resolve) => this.load(() => resolve(this)));
}
