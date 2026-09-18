const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  // SVGs go through the SVG transformer (treated as source); .pdf is a binary
  // asset that should be served by Metro just like any image.
  assetExts: [
    ...resolver.assetExts.filter((ext) => ext !== "svg"),
    "pdf",
  ],
  sourceExts: [...resolver.sourceExts, "svg"],
};

module.exports = config;
