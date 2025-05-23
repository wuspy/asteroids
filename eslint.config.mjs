
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unnecessary-type-constraint": "off",
        "@typescript-eslint/no-namespace": [ "error", { "allowDeclarations": true } ],
        "@typescript-eslint/triple-slash-reference": "off",
        "max-len": [ "warn", { "code": 120 } ],
        "no-trailing-spaces": [ "warn", { "ignoreComments": true } ],
    }
});
