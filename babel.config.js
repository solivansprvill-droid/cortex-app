module.exports = function (api) {
  api.cache(true);

  // NOTE: react-native-reanimated@4.x and react-native-worklets are already
  // included by babel-preset-expo. Do NOT add them manually here — doing so
  // causes a "Duplicate plugin/preset detected" error during Metro bundling.
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
  };
};
