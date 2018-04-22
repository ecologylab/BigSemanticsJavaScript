module.exports = {
  entry: "./build/bigsemantics-core.js",
  devtool: "source-maps",
  output: {
    path: __dirname + "/build/",
    filename: "bigsemantics-core.bundle.js",
    libraryTarget: "umd",
    library: "bigsemantics"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          "source-map-loader"
        ],
        enforce: "pre"
      }
    ]
  }
}
