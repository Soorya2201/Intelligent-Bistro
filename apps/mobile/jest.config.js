/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: {
        resolveJsonModule: true,
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  // Ignore everything that needs a native runtime — our tests are pure TS
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    // Prevent any accidental RN module imports from exploding
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
};
