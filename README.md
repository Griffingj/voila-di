# Voilà, Dependency Injection
[![Build Status](https://travis-ci.org/Griffingj/voila-di.svg?branch=master)](https://travis-ci.org/Griffingj/voila-di)
[![Test Coverage](https://codeclimate.com/github/Griffingj/voila-di/badges/coverage.svg)](https://codeclimate.com/github/Griffingj/voila-di/coverage)

A dependency injection library for async utility, modularity, and testability

Create the dependency injection container

```javascript
import di from 'voila-di';

const container = di();
```

Configure a dependency graph and get values

```javascript
import di from 'voila-di';

function getPromise(val) {
  return new Promise<any>(resolve => setTimeout(() => resolve(val), 50));
}

const container = di({
  // You can specify a value named 'a' and a function
  // whose parameters indicate named dependencies from
  // elsewhere in the graph
  a: (b, c, d) => getPromise(b + c + d + 1),
  // Or the function can return a value
  b(e) {
    return 2;
  },
  // Or you can directly specify a promise
  c: getPromise(5),
  // Or a non-function value
  d: 5,
  // Or do arbitrary imperative tasks
  e: () => console.log('e done before b'),
  // And it works with async/await
  async f() {
    const val = await getPromise(5);
    return val + 1;
  }
});

// It will lazily resolve only the transitive dependencies of the requested key
container.get('a').then(console.log);
// => e done before b
// => 13

// Or it can eagerly load the entire graph,
// Note: will only eagerly load if container.then or container.catch is called
const values = await container;
console.log(values);
// => { d: 5, e: undefined, b: 2, c: 5, f: 6, a: 13 }
```

Configure a dependency graph and ensure all the tasks are triggered once

```javascript
import di from 'voila-di';

function printEventually(val) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(val);
      resolve();
    }, 50);
  });
}

const container2 = di({
  a: (b, c) => printEventually('a done after b and c'),
  b: (c) => printEventually('b done after c'),
  c: () => printEventually('c done'),
  d: 5,
  e: (d) => d + 1
});

container2.getAll().then(console.log);
// => c done
// => b done after c
// => a done after b and c
// => { d: 5, e: 6, c: undefined, b: undefined, a: undefined }
```

Resolve a graph with resolvable circular dependencies

```javascript
import di from 'voila-di';

const container = di({
  a(b) {
    return {
      print: () => 1 + b.provide,
      provide: 1
    };
  },
  b(c) {
    return {
      print: () => 1 + c.provide,
      provide: 2
    };
  },
  c(a) {
    return {
      print: () => 1 + a.provide,
      provide: 3
    };
  }
});

const { a, b, c } = await container;
console.log(`a: ${a.print()}, b: ${b.print()}, c: ${c.print()}`);
// => a: 3, b: 4, c: 2
```

Inspect a tree view of all of the dependencies in the graph using `topiary` to pretty print the tree

```javascript
import di           from 'voila-di';
import * as topiary from 'topiary';

const container3 = di({
  service1: (service2, service3) => {},
  service2: (service3) => {},
  service3: () => {},
});

const tree = container3.getTree();
const treeView = topiary(tree, 'children', { sort: true });
console.log(treeView);

// container
//  ├─┬service1
//  │ ├─┬service2
//  │ │ └──service3
//  │ └──service3
//  ├─┬service2
//  │ └──service3
//  └──service3
```

