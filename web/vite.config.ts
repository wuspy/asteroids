import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import solidPlugin from 'vite-plugin-solid';
import { viteStaticCopy } from "vite-plugin-static-copy";

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;

const hmr = true;

export default defineConfig({
    plugins: [
        glsl({
            compress: true,
        }),
        solidPlugin({
            hot: hmr,
            solid: {
                generate: "universal",
                moduleName: "/src/solid-pixi",
            },
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
        hmr,
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
