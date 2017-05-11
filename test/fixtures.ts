function promiseWith<T>(val): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(val), 50);
  });
}

export const funcSingleFile = {
  a: (b) => b + 1,
  b: (c) => c + 2,
  c: (d) => d + 3,
  d: (e) => e + 4,
  e: (f) => f + 5,
  f: () => 5,
};

export const funcSingleFileUndefinedVal = {
  a: (b) => b + 1,
  b: (c) => c + 2,
  c: (d) => d + 3,
  d: (e) => e + 4,
  e: (f) => 5,
  f: () => undefined,
};

export const strictSingleFile = {
  a: { dependencies: ['b'], provider: (b) => b + 1 },
  b: { dependencies: ['c'], provider: (c) => c + 2 },
  c: { dependencies: ['d'], provider: (d) => d + 3 },
  d: { dependencies: ['e'], provider: (e) => e + 4 },
  e: { dependencies: ['f'], provider: (f) => f + 5 },
  f: { provider: () => 5 },
};

export const strictSingleFileTree = {
  name: 'container', children: [
    { name: 'f', children: [] },
    { name: 'e', children: [
      { name: 'f', children: [] } ] },
    { name: 'd', children: [
      { name: 'e', children: [
        { name: 'f', children: [] } ] } ] },
    { name: 'c', children: [
      { name: 'd', children: [
        { name: 'e', children: [
          { name: 'f', children: [] } ] } ] } ] },
    { name: 'b', children: [
      { name: 'c', children: [
        { name: 'd', children: [
          { name: 'e', children: [
            { name: 'f', children: [] } ] } ] } ] } ] },
    { name: 'a', children: [
      { name: 'b', children: [
        { name: 'c', children: [
          { name: 'd', children: [
            { name: 'e', children: [
              { name: 'f', children: [] } ] } ] } ] } ] } ] }
  ]
};

export const funcBroad = {
  a: (b, c, d, e, f) => b + c + d + e + f + 5,
  b: () => 1,
  c: () => 2,
  d: () => 3,
  e: () => 4,
  f: () => 5,
};

export const strictBroad = {
  a: { dependencies: ['b', 'c', 'd', 'e', 'f'], provider: (b, c, d, e, f) => b + c + d + e + f + 5 },
  b: { provider: () => 1 },
  c: { provider: () => 2 },
  d: { provider: () => 3 },
  e: { provider: () => 4 },
  f: { provider: () => 5 },
};

export const funcSingleFilePromise = {
  a: (b) => promiseWith(b + 1),
  b: (c) => promiseWith(c + 2),
  c: (d) => promiseWith(d + 3),
  d: (e) => promiseWith(e + 4),
  e: (f) => promiseWith(f + 5),
  f: () => promiseWith(5),
};

export const strictSingleFilePromises = {
  a: { dependencies: ['b'], provider: (b) => promiseWith(b + 1) },
  b: { dependencies: ['c'], provider: (c) => promiseWith(c + 2) },
  c: { dependencies: ['d'], provider: (d) => promiseWith(d + 3) },
  d: { dependencies: ['e'], provider: (e) => promiseWith(e + 4) },
  e: { dependencies: ['f'], provider: (f) => promiseWith(f + 5) },
  f: { provider: () => promiseWith(5) },
};

export const funcBroadPromises = {
  a: (b, c, d, e, f) => promiseWith(b + c + d + e + f + 5),
  b: () => promiseWith(1),
  c: () => promiseWith(2),
  d: () => promiseWith(3),
  e: () => promiseWith(4),
  f: () => promiseWith(5),
};

export const strictBroadPromises = {
  a: { dependencies: ['b', 'c', 'd', 'e', 'f'], provider: (b, c, d, e, f) => promiseWith(b + c + d + e + f + 5) },
  b: { provider: () => promiseWith(1) },
  c: { provider: () => promiseWith(2) },
  d: { provider: () => promiseWith(3) },
  e: { provider: () => promiseWith(4) },
  f: { provider: () => promiseWith(5) },
};

export const mixed = {
  // function that returns a promise
  a: (b, c, d) => promiseWith(b + c + d + 1),
  // function that returns a value
  b: (g) => 2 + g,
  // key value declaration with a promise
  c: promiseWith(5),
  // functions that return a promise
  d: (e, f) => promiseWith(e + f + 1), // 12
  e: (f) => promiseWith(f + 1), // 6
  // strict declaration
  f: { dependencies: ['y'], provider: (y) => promiseWith(5) },
  // key value declaration
  g: 5,
  // strict declaration without dependencies
  x: { provider: (y) => promiseWith(5) },
  y: 20
};

export const broadShortPromises = {
  a: (d) => promiseWith(1 + d),
  b: (e) => promiseWith(2 + e),
  c: (f) => promiseWith(3 + f),
  d: () =>  promiseWith(4),
  e: () =>  promiseWith(5),
  f: () =>  promiseWith(6)
};

export const strictPartialLeft = {
  a: { dependencies: ['b'], provider: (b) => b + 1 }
};

export const strictPartialRight = {
  b: { provider: () => 1 }
};

export const strictPartialRightCircular = {
  a: { dependencies: ['a'], provider: (a) => a + 1 }
};

export const simpleCircularResolve = {
  a(b) {
    return {
      do: () => 1 + b.provide,
      provide: 1
    };
  },
  b(c) {
    return {
      do: () => 1 + c.provide,
      provide: 2
    };
  },
  c(a) {
    return {
      do: () => 1 + a.provide,
      provide: 3
    };
  }
};
