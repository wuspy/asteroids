import { readFileSync } from "fs";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

const version = JSON.parse(readFileSync("./package.json", "utf8")).version;

const hmr = true;

export default defineConfig({
    plugins: [
        solidPlugin({
            hot: hmr,
            solid: {
                generate: "universal",
                moduleName: "/src/solid-pixi",
            },
        }),
        visualizer(),
    ],
    define: {
        "process.env.npm_package_version": `"${version}"`,
    },
    server: {
        hmr,
        host: "0.0.0.0",
        port: 8081,
    },
    build: {
        target: "ES2017",
        rollupOptions: {
            input: {
                index: "./index.html",
                about: "./about.html",
            },
        },
    },
});
