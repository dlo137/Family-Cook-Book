const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// In dev/Expo Go, react-native-iap requires native modules (nitro-modules)
// that aren't available. Stub the entire module so bundling succeeds.
if (!process.env.EAS_BUILD) {
  const originalResolver = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "react-native-iap") {
      return {
        filePath: path.resolve(__dirname, "mocks/react-native-iap.js"),
        type: "sourceFile",
      };
    }
    if (originalResolver) {
      return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
