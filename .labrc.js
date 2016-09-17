module.exports = {
  parallel: true,
  shuffle: true,
  leaks: false,
  verbose: true,
  coverage: true,
  reporter: 'console',
  'coverage-path': './src',
  transform: './src/test/transform.js',
  paths: [
    'src/test'
  ]
};
