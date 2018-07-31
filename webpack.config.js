var fs = require("fs");
var path = require('path');
var TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: __dirname + "/src/adbd.ts",
  output: {
    path: __dirname + "/compile",
    filename: "server.js",
  },
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    modules: [path.resolve("./src"), "node_modules"],
    plugins: [
      new TsconfigPathsPlugin({ 
      configFile: path.resolve("./tsconfig.json") })
    ]
  },
  module: {
    rules: [{
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      test: /\.tsx?$/,
      use: [
        {
          loader: "ts-loader",
        }
      ]
    }]
  },
  target: "node",
  mode: "development",
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  }
};