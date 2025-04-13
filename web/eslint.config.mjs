import solidPlugin from "eslint-plugin-solid";
import tseslint from 'typescript-eslint';
import root from "../eslint.config.mjs";

export default tseslint.config({
    extends: [root, solidPlugin.configs["flat/typescript"]],
    rules: {
        "solid/style-prop": "off",
    },
});
