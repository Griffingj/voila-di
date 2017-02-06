const ts = require('typescript');

module.exports = [{
  ext: '.ts',
  transform(content, filename) {
    if (filename.indexOf('node_modules') === -1) {
      return ts.transpile(content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS
        }
      });
    }
    return content;
  }
}];