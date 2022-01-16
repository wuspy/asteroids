import yoga, { YogaWasm } from "yoga-layout-wasm";

// TODO calling any function on a yoga.Node that returns YGValue throws UnboundTypeError
// https://github.com/pinqy520/yoga-layout-wasm/issues/4

let instance: YogaWasm | undefined;

export const getYoga = (): YogaWasm => {
    if (instance === undefined) {
        throw new Error("Yoga is not initialized");
    }
    return instance;
}

export const initYoga = async (): Promise<YogaWasm> => {
    if (instance === undefined) {
        instance = await yoga.init();
    }
    return instance;
}

export {
    YogaNode,
    YogaMeasureMode,
    YogaUnit,
    YogaAlign,
    YogaJustifyContent,
    YogaFlexDirection,
    YogaFlexWrap,
    YogaEdge,
    YogaPositionType,
} from "yoga-layout-wasm";

export default yoga;
