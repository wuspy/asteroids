const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const HtmlInlineCssPlugin = require("html-inline-css-webpack-plugin").default;
const CircularDependencyPlugin = require("circular-dependency-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const mode = process.env.NODE_ENV === "production" ? "production" : "development";

const index = {
    entry: ["./src/index.ts", "./src/scss/index.scss"],
    target: ["web", "es5"],
    output: {
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
        }),
        new HtmlWebpackPlugin({
            template: "./src/html/index.html",
            scriptLoading: "blocking",
            inject: "body",
        }),
        ...(mode === "production" ? [
            new HtmlInlineScriptPlugin(),
            new HtmlInlineCssPlugin(),
        ] : [])
    ],
    module: {
        rules: [{
                test: /\.(ts|tsx)$/i,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.es5.json"
                    },
                }],
                exclude: ["/node_modules/"],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".scss"],
    },
};

const asteroids = {
    entry: "./src/asteroids.ts",
    target: ["web", "es6"],
    output: {
        filename: "asteroids.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            include: /src/,
            // add errors to webpack instead of warnings
            failOnError: true,
            // allow import cycles that include an asyncronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            allowAsyncCycles: false,
            // set the current working directory for displaying module paths
            cwd: process.cwd(),
        }),
    ],
    module: {
        rules: [{
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
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
    },
    optimization: {
        minimizer: [new TerserPlugin({
            terserOptions: {
                mangle: {
                    properties: {
                        regex: /^_/,
                    },
                },
            },
        })],
    },
};

module.exports = [
    {...index, mode },
    {...asteroids, mode },
];