
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'chart.js'
    },
    target: "web",
    mode: "development",
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