const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const HtmlInlineCssPlugin = require("html-inline-css-webpack-plugin").default;
const CircularDependencyPlugin = require("circular-dependency-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const dist = path.resolve(__dirname, "dist");

const index = {
    entry: ["./src/browser/main.ts", "./scss/index.scss"],
    target: ["web", "es5"],
    output: {
        path: dist,
        clean: true,
    },
    devtool: mode === "development" ? "source-map" : undefined,
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: "public",
                globOptions: {
                    // HTML is processed through HtmlWebpackPlugin
                    ignore: ["**/*.html"],
                },
            }],
        }),
        new webpack.DefinePlugin({
            "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            scriptLoading: "blocking",
            inject: "body",
        }),
        ...(mode === "production" ? [
            new HtmlInlineScriptPlugin(),
            new HtmlInlineCssPlugin({
                replace: {
                    target: "<index.scss/>",
                    removeTarget: true,
                },
            }),
        ] : [])
    ],
    module: {
        rules: [{
                test: /\.(ts|tsx)$/i,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.es5.json",
                    },
                }],
                exclude: ["/node_modules/"],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".scss"],
    },
};

const asteroids = {
    entry: "./src/browser/asteroids.ts",
    target: ["web", "es6"],
    output: {
        filename: "asteroids.js",
        path: dist,
    },
    devtool: mode === "development" ? "source-map" : undefined,
    plugins: [
        new webpack.DefinePlugin({
            "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            // add errors to webpack instead of warnings
            failOnError: true,
            // allow import cycles that include an asyncronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            allowAsyncCycles: false,
            // set the current working directory for displaying module paths
            cwd: process.cwd(),
        }),
        new CopyPlugin({
            patterns: [
                "node_modules/yoga-layout-wasm/dist/yoga.wasm",
            ],
        }),
    ],
    module: {
        rules: [{
                test: /\.(ts|tsx)$/i,
                use: [{
                    loader: 'ts-loader',
                }],
                exclude: ["/node_modules/"],
            },
            {
                test: /\.(glsl|vert|frag)$/,
                loader: "ts-shader-loader",
                exclude: ["/node_modules/"],
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            // path/fs required for yoga-layout-wasm
            path: false,
            fs: false,
        },
    },
};

module.exports = [
    {...index, mode },
    {...asteroids, mode },
];