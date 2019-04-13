
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'chart.js'
    },
    target: "web",
    mode: "production",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                            , ["minify", {
                                "keepFnName": true,
                                "builtIns": false
                            }]
                        ]
                    }
                }]
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
        extensions: [".js", ".json", ".jsx", ".css"]
    }
};