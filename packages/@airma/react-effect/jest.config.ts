import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testTimeout: 10000,
  maxWorkers: 5,
  maxConcurrency: 5,
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.test.tsx'],
  rootDir: '.',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)?$': '<rootDir>/test/__config__/babel.test.config.js'
  },
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '@airma/react-state': '@airma/react-state/src',
    '@airma/restful': '@airma/restful/src',
    '@airma/react-hooks-core': '@airma/react-hooks-core/src',
    '@airma/react-effect': '@airma/react-effect/src',
    '@airma/react-hooks': '@airma/react-hooks/src',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '@/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/test/$1'
  },
  bail: 1,
  noStackTrace: true,
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'jsdom'
};

export default config;
