import { IAddOptions, Loader, LoaderResource } from "@pixi/loaders";

/**
 * A simple mixin to add promises to Loader, and to undo their decision to throw an error
 * if load() is called for a resource that's already loaded.
 */

declare module "@pixi/loaders"
{
    interface Loader {
        promise(): Promise<Loader>;
    }
}

const loader = Loader.prototype;
const _super = {
    // @ts-expect-error
    _add: loader._add,
};

loader.promise = function(): Promise<Loader> {
    return new Promise((resolve) => this.load(() => resolve(this)));
}

// @ts-expect-error
loader._add = function(name: string, url: string, options: IAddOptions, callback?: LoaderResource.OnCompleteSignal): Loader {
    if (!this.resources[name]) {
        return _super._add.call(this, name, url, options, callback);
    } else {
        return this;
    }
}
