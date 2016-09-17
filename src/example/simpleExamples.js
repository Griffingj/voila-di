/* eslint no-console: 0 */
import containerFactory from '../lib/containerFactory';

const container = containerFactory();

// Store a value directly
container.register({
  key: 'a',
  value: 'apple'
});


// Store the value returned from a factory function
function bananaFactory() {
  const banana = {
    source: 'banana'
  };
  // The value other components may depend on
  return banana;
}

container.register({
  key: 'b',
  factory: bananaFactory
});


// Store the value returned from using the new operator on a constructor function
function Coconut(dependency) {
  this.dependency = dependency;
}

Coconut.prototype = {
  message() {
    return `I am a coconut and contain a ${this.dependency}`;
  }
};

container.register({
  key: 'c',
  constructorFunc: Coconut,
  requirements: ['a']
});


// Store the value from a factory which takes a node-style callback as the last
// argument
function formatterFactory(a, b, c, callback) {
  const value = {
    toString() {
      return 'I am a formatter and I depend on these ' +
        `"${JSON.stringify({ a, b, c })}", c.message() is "${c.message()}"`;
    }
  };
  setTimeout(() => callback(null, value), 500);
}

container.register({
  key: 'formatter',
  factoryWithCallback: formatterFactory,
  requirements: ['a', 'b', 'c']
});


// Store the resolved value from a factory that returns a promise, some clearer
// interface abstraction in this example
function printerFactory(formatter, logable) {
  return new Promise(resolve => {
    setTimeout(() => {
      const value = {
        print() {
          logable.log(formatter.toString());
        }
      };
      resolve(value);
    }, 500);
  });
}

container.register({
  key: 'logger',
  value: console
});

container.register({
  key: 'printer',
  factoryResolvePromise: printerFactory,
  requirements: ['formatter', 'logger']
});


// Resolve dependencies lazily
container
  .resolve('printer')
  .then(printer => printer.print())
  .catch(error => console.log(error.stack));
// => I am a formatter and I depend on these "{"a":"apple","b":{"source":"banana"},"c":{"dependency":"apple"}}", c.message() is "I am a coconut and contain a apple"
