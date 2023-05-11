import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import { viteStaticCopy } from "vite-plugin-static-copy";

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;

export default defineConfig({
    plugins: [
        glsl({
            compress: true,
        }),
        viteStaticCopy({
            targets: [
                {
                    src: "../node_modules/@wuspy/yoga-layout-wasm/dist/yoga.wasm",
                    dest: ".",
                }
            ]
        }),
        visualizer(),
    ],
    define: {
        "process.env.npm_package_version": `"${version}"`,
    },
    server: {
        port: 8081,
    },
    build: {
        target: "ES2017",
        rollupOptions: {
            input: {
                main: "./index.html",
                about: "./about.html",
            },
        },
    },
});
