/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: {
        resolveJsonModule: true,
        esModuleInterop: true,
      },
    }],
  },
};
