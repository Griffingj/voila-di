/* eslint no-console: 0 */
import containerFactory from '../lib/container/containerFactory';

const container = containerFactory();

// Store a value directly
container.value('a', 'apple');


// Store the value returned from a factory function
function bananaFactory() {
  const banana = {
    source: 'banana'
  };
  // The value other components may depend on
  return banana;
}
container.factory('b', bananaFactory);


// Store the value returned from using the new operator on a constructor function
function Coconut(dependency) {
  this.dependency = dependency;
}

Coconut.prototype = {
  message() {
    return `I am a coconut and contain a ${this.dependency}`;
  }
};
container.constructorFunc('c', Coconut, ['a']);


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
formatterFactory.withCallback = true;
container.factory('formatter', formatterFactory, ['a', 'b', 'c']);


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
printerFactory.resolvePromise = true;
container.value('logger', console);
container.factory('printer', printerFactory, ['formatter', 'logger']);

// Resolve dependencies lazily
container
  .resolve('printer')
  .then(printer => printer.print())
  .catch(error => console.log(error));
// => I am a formatter and I depend on these "{"a":"apple","b":{"source":"banana"},"c":{"dependency":"apple"}}", c.message() is "I am a coconut and contain a apple"
