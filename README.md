# Voilà
[![Build Status](https://travis-ci.org/Griffingj/voila.svg?branch=master)](https://travis-ci.org/Griffingj/voila)
[![Code Climate](https://codeclimate.com/github/Griffingj/voila/badges/gpa.svg)](https://codeclimate.com/github/Griffingj/voila)
[![Test Coverage](https://codeclimate.com/github/Griffingj/voila/badges/coverage.svg)](https://codeclimate.com/github/Griffingj/voila/coverage)

A dependency injection container built with proxys that can handle circular 
references

Create the dependency injection container

```javascript
const container = voila.create();
```

Store a value directly

```javascript
container.value('a', 'apple');
```

Store a value returned from a factory function  

```javascript
function bananaFactory() {
  const banana = {
    source: 'banana'
  };
  // The value other components may depend on
  return banana;
}
container.factory('b', bananaFactory);
```

Store a value returned by using the new operator on a constructor function

```javascript
function Coconut(dependency) {
  this.dependency = dependency;
}

Coconut.prototype = {
  message() {
    return `I am a coconut and contain a ${this.dependency}`;
  }
};
container.constructorFunc('c', Coconut, ['a']);
```

Store a value from a factory which takes a node-style callback as the last argument

```javascript
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
```


Store the resolved value from a factory that returns a promise

```javascript
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
```

Resolve dependencies lazily

```javascript
container
  .resolve('printer')
  .then(printer => printer.print())
// => I am a formatter and I depend on these "{"a":"apple","b":{"source":"banana"},"c":{"dependency":"apple"}}", c.message() is "I am a coconut and contain a apple"
```

Resolve circular dependencies

```javascript
container.factory('x', (y) => {
  return {
    message() {
      return `x["${y.forX()}"]`;
    },
    forY() {
      return 'x.forY';
    }
  };
}, ['y']);

container.factory('y', (x) => {
  return {
    message() {
      return `y["${x.forY()}"]`;
    },
    forX() {
      return 'y.forX';
    }
  };
}, ['x']);

container
  .resolve('x')
  .then(x => console.log(x.message()));
// => 'x["y.forX"]'
```
