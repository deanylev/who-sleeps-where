// work around https://github.com/roma-lukashik/animal-avatar-generator/issues/7
// based on https://stackoverflow.com/a/75109686
module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            }
          }
        ]
      }
    }
  }
};
