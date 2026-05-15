const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const rootModules  = path.resolve(monorepoRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Watch monorepo root for hoisted packages (@expo/vector-icons, etc.)
config.watchFolders = [monorepoRoot];

// Resolve local node_modules first, root as fallback only
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Block root-level copies of native packages that have a local copy.
// npm workspaces hoists these to root but Metro must only bundle one copy
// or React Native throws "Tried to register two views with same name".
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NATIVE_PKGS = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-webview',
  'react-native-markdown-display',
  '@shopify/flash-list',
];

const blockPatterns = NATIVE_PKGS
  .filter(pkg => {
    // Only block root copy if a local copy exists
    try {
      require.resolve(
        path.join(projectRoot, 'node_modules', pkg, 'package.json')
      );
      return true;
    } catch { return false; }
  })
  .map(pkg => new RegExp(`^${escape(path.join(rootModules, pkg))}.*`));

const existing = config.resolver.blockList;
config.resolver.blockList = existing
  ? (Array.isArray(existing) ? [...existing, ...blockPatterns] : [existing, ...blockPatterns])
  : blockPatterns;

// Platform-specific extensions (.web.tsx, .web.ts)
config.resolver.platforms = [...(config.resolver.platforms ?? []), 'web'];

module.exports = config;
