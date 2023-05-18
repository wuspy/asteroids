import yoga, { YogaWasm } from "@wuspy/yoga-layout-wasm";
import yogaWasmUrl from "@wuspy/yoga-layout-wasm/dist/yoga.wasm?url";

let instance: YogaWasm | undefined;

const getYoga = (): YogaWasm => {
    if (instance === undefined) {
        throw new Error("Yoga is not initialized");
    }
    return instance;
}

export const initYoga = async (): Promise<YogaWasm> => {
    if (instance === undefined) {
        instance = await yoga.init(yogaWasmUrl);
    }
    return instance;
}

export default getYoga;
