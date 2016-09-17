# Voilà
#####Basic Usage

Create the dependency injection container

```javascript
const container = voila.create();
```

Store a value directly

```javascript
container.register({
  key: 'a',
  value: 'apple'
});
```

Store a value returned from a factory function  

```javascript
function bananaFactory() {
  const banana = {
    source: 'banana'
  };
  return banana;
}

container.register({
  key: 'b',
  factory: bananaFactory
});
```

Store a value returned by using the new operator on a constructor function

```javascript
function Coconut(dependency) {
  this.dependency = dependency;
}

Coconut.prototype = {
  message() {
    return 'I am a coconut and contain a: ' + JSON.stringify(this.dependency);
  }
};

container.register({
  key: 'c',
  constructorFunc: Coconut,
  requirements: ['a']
});
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

container.register({
  key: 'formatter',
  factoryWithCallback: formatterFactory,
  requirements: ['a', 'b', 'c']
});
```


Store the resolved value from a factory that returns a promise

```javascript
function printerFactory(formatter, logable) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Provide *a* value that depends on another value that has a log function
      const value = {
        print() {
          logable.log(formatter.toString());
        }
      };
      resolve(value);
    }, 500);
  });
}

// Register the console as *the* 'logger'
container.register({
  key: 'logger',
  value: console
});

// Register *a* value from the printerFactory as *the* 'printer', given *the* values 'formatter' and 'logger'
container.register({
  key: 'printer',
  factoryResolvePromise: printerFactory,
  requirements: ['formatter', 'logger']
});
```

Resolve dependencies lazily

```javascript
container
  .resolve('printer')
  .then(printer => printer.print())
  .catch(error => console.log(error.stack));
// => I am a formatter and I depend on these "{"a":"apple","b":{"source":"banana"},"c":{"dependency":"apple"}}", c.message() is "I am a coconut and contain a apple"
```
