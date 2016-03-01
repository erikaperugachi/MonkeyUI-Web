var path = require('path');
module.exports = { 
  entry: path.join(__dirname, './ChatUI.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    //publicPath: "http://localhost:8080/chat",
    filename: 'monkeyUI.js',
    library: "monkeyUI"
  },
   externals: {
      monkey:"monkey"
    //  on the global var jQuery
  },
   module: {
      loaders: [
          { test: /(MUIConversation\.js|MUIMessage\.js|MUIUser\.js|ChatUI\.js)$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
              presets: ['es2015']
            }
          },
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

