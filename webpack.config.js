//var webpack = require("webpack");
var path = require('path');
module.exports = { 
  entry: './ChatUI.js',
  output: {
    filename: 'monkeyui.js',
    library: "monkeyui"
  },
   externals: {
      monkey:"monkey"
    //  on the global var jQuery
  },
   module: {
      loaders: [
          // { test: /ChatUI\.js$/,
          //   loader: 'babel-loader',
          //   exclude: /node_modules/,
          //   query: {
          //     presets: ['es2015']
          //   }
          // },
          {
            test: /\.css$/,
            loader: 'style!css?sourceMap'
          }, {
            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?name=[name].[ext]&limit=10000&mimetype=application/font-woff"
          }, {
            test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?name=[name].[ext]&limit=10000&mimetype=application/font-woff"
          }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?name=[name].[ext]&limit=10000&mimetype=application/octet-stream"
          }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: "file?name=[name].[ext]"
          }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?name=[name].[ext]&limit=10000&mimetype=image/svg+xml"
          }
      ]
  }
};

