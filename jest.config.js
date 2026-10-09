module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // Shared fakes live next to the tests but aren't test files themselves.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/support/'],
  // Jest resolves lucide's untransformed .mjs build via the "react-native" field.
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-svg|lucide-react-native|uuid)/)',
  ],
};
