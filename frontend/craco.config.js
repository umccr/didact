/* eslint-disable */
const webpack = require("webpack");

module.exports = {
    style: {
        postcss: {
            plugins: [require("tailwindcss"), require("autoprefixer")],
        },
    },
    webpack: {
        plugins: {
            add: [
                new webpack.ProvidePlugin({
                    $: "jquery",
                    jQuery: "jquery",
                }),
            ],
        },
        configure: (webpackConfig, { env, paths }) => {
            /* As part of the CSP re-enable work should check if this is needed
            if (webpackConfig.devtool) {
              console.log(
                "Forcing all builds to use source-map to prevent unsafe eval() - that is denied by our CSP"
              );
              console.log("See https://github.com/webpack/webpack/issues/5627");

              webpackConfig.devtool = "source-map";
            } */

            if (webpackConfig.optimization) {
                if (webpackConfig.optimization.splitChunks) {
                    console.log(
                        "Augmenting webpack optimisation split chunks to prevent files to big for ELB Lambda"
                    );

                    webpackConfig.optimization.splitChunks.maxSize = 450000;
                }
            }
            return webpackConfig;
        },
    },
};

