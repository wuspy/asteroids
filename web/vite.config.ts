import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import sitemap from "vite-plugin-sitemap";
import solidPlugin from "vite-plugin-solid";
import { version } from "./package.json";

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
        sitemap({
            // TODO don't hardcode this here
            hostname: "https://jacobjordan.tech",
            readable: true,
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
