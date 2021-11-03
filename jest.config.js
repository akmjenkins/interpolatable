module.exports = {
  transform: {
    '^.+\\.jsx?$': require.resolve('babel-jest'),
    '^.+\\.ts?$': 'ts-jest',
  },
  collectCoverageFrom: ['./index.js'],
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90 },
  },
};
