const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // TODO: Write function to generate list of entry files
    entry: {
        css: './src/styles/styles.css',
        main: './src/js/main.js',
        performance: './src/js/performance.js',
        tickets: './src/js/tickets.js'
    },
    output: {
      path: path.resolve(__dirname, '_site'),
      filename: 'js/[name].js',
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
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles/styles.css',
      })
    ],
};