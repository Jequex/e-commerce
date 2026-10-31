const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Disable hierarchical lookup to keep monorepo resolution deterministic
config.resolver.disableHierarchicalLookup = true;

// 4. Force a strict single instance of React and React Native across all dependencies
const reactPath = path.resolve(monorepoRoot, 'node_modules/react');
const reactNativePath = path.resolve(monorepoRoot, 'node_modules/react-native');

config.resolver.extraNodeModules = {
  react: reactPath,
  'react-native': reactNativePath,
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return {
      filePath: path.resolve(reactPath, 'index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react/jsx-runtime') {
    return {
      filePath: path.resolve(reactPath, 'jsx-runtime.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return {
      filePath: path.resolve(reactPath, 'jsx-dev-runtime.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native') {
    return {
      filePath: path.resolve(reactNativePath, 'index.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
