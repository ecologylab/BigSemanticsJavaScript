module.exports = {
  entry: "./build/bigsemantics-core.js",
  devtool: "inline-source-maps",
  output: {
    path: __dirname + "/build/",
    filename: "bigsemantics-core.bundle.js",
    libraryTarget: "umd",
    library: "bigsemantics"
  }
}
