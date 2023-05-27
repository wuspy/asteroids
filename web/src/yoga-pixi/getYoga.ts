import yoga, { Yoga } from "yoga-wasm-web";
import url from "yoga-wasm-web/dist/yoga.wasm?url";

let instance: Yoga | undefined;

function getYoga(): Yoga {
    if (instance === undefined) {
        throw new Error("Yoga is not initialized");
    }
    return instance;
}

export async function initYoga(): Promise<Yoga> {
    if (instance === undefined) {
        try {
            const load = fetch(url);

            const source = typeof WebAssembly.compileStreaming === "function"
                ? WebAssembly.compileStreaming(load)
                : WebAssembly.compile(await (await load).arrayBuffer());

            instance = await yoga(await source);
        } catch (e) {
            console.error("yoga wasm initialization failed, falling back to asm", e);
            instance = (await import("yoga-wasm-web/asm")).default();
        }
    }
    return instance;
}

export default getYoga;
