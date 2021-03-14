const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/styles/styles.css',
    output: {
      path: path.resolve(__dirname, '_site'),
      filename: 'main.js',
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, 'postcss.config.js'),
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles/styles.css',
      })
    ],
};