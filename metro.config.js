const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Force Babel to transform these node_modules so Hermes can handle
// private class fields (#field) and other modern JS syntax
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|expo|@expo|@supabase|' +
  'react-native-url-polyfill|react-native-screens|react-native-safe-area-context|' +
  '@react-navigation|react-native-reanimated|@unimodules|unimodules)/)',
];

// Block OpenTelemetry packages that use dynamic imports incompatible with Hermes
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
