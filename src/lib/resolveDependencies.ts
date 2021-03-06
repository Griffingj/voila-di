import { DependencyNode } from '../index';
import { Declaration } from '../index';
import { Success } from '../index';
import { StrictGraph } from '../index';
import { HandleCircular } from './containerFactory';
import { ProxyController } from './proxify';
import makeSinglyLinkedList from './singlyLinkedList';

export type PostProcess = (node: DependencyNode, value: any) => any;
export type ProxyPatches = Array<[DependencyNode, ProxyController<any>]>;

export type Wrap = (
  node: DependencyNode,
  provider,
  postProcess: PostProcess,
  args?) => Promise<any>;

export interface InternalFailure<T> {
  kind: 'Failure';
  value: T;
}

// Ensure that the value from a provider is postProcessed,
// wrapped in a promise, and guard against sync errors being
// thrown
const wrap: Wrap = (node, provider, postProcess, args) => {
  let maybePromise;

  try {
    maybePromise = provider(...args);
  } catch (error) {
    return Promise.reject(error);
  }

  if (typeof (maybePromise && maybePromise.then) !== 'function') {
    maybePromise = Promise.resolve(maybePromise);
  }
  return maybePromise.then(value => postProcess(node, value));
};

type FulfillResult = Success<Promise<any>> | InternalFailure<string[]>;

function tryFulfill(
  node: DependencyNode,
  lookup: Map<string, any>,
  postProcess: PostProcess): FulfillResult {

  const unfulfillable: string[] = [];
  const activeDeps: Array<Promise<any>> = [];
  const { dependencies, provider } = node;

  for (const key of dependencies!) {
    const promise = lookup.get(key);

    if (promise === undefined) {
      unfulfillable.push(key);
    } else {
      activeDeps.push(promise);
    }
  }

  if (!unfulfillable.length) {
    // If the current node's dependencies are all in the lookup,
    // generate the promise and set it in the lookup
    const value = Promise
      .all(activeDeps)
      .then((results) => wrap(node, provider, postProcess, results));

    return { kind: 'Success', value };
  }

  return {
    kind: 'Failure',
    value: unfulfillable
  };
}

export type ResolveDependenciesResult = {
  kind: 'Success',
  proxyPatches: ProxyPatches
} | {
  kind: 'MissingDependencyFailure',
  message: string
} | {
  kind: 'CircularDependencyFailure',
  message: string,
  value: { history: Set<string> }
};

export type ResolveDependencies = (
  rootKey: string,
  rootDeclaration: Declaration,
  declarationLookup: StrictGraph,
  handleCircular: HandleCircular,
  postProcess: PostProcess,
  lookup: Map<string, any>) => ResolveDependenciesResult;

const resolveDependencies: ResolveDependencies = (
  rootKey,
  rootDeclaration,
  declarationLookup,
  handleCircular,
  postProcess,
  // Will mutate
  lookup) => {

  // This is used in the resolution of circular dependencies
  type ProxyPatch = [DependencyNode, ProxyController<any>];
  const proxyPatches: ProxyPatch[] = [];

  // Use iterative tree search to resolve the tree
  // of all dependencies for this key, and memoize them
  const root = {
    history: new Set(),
    key: rootKey,
    ...rootDeclaration
  };

  const unvisited = makeSinglyLinkedList<DependencyNode>();
  unvisited.add(root);
  const defered = makeSinglyLinkedList<DependencyNode>();
  let current: DependencyNode;

  while (current = unvisited.remove()!) {
    const {
      dependencies,
      history,
      key,
      provider
    } = current;

    // If the current node has no dependencies
    if (!dependencies || !dependencies.length) {
      const wrapped = wrap(current, provider, postProcess);
      lookup.set(key, wrapped);
      continue;
    }
    // Otherwise try to fulfill the declaration by checking each dependency
    const result = tryFulfill(current, lookup, postProcess);

    if (result.kind === 'Success') {
      lookup.set(key, result.value);
    } else {
      defered.add(current);
      const childkeys = result.value;

      for (const childkey of childkeys) {
        const declaration = declarationLookup[childkey];

        // If the current depKey cannot be found in the graph, fail
        if (!declaration) {
          return {
            kind: 'MissingDependencyFailure',
            message: `"${key}" required missing dependency "${childkey}"`
          };
        }

        if (history.has(childkey)) {
          // If the current dependency has been visited on this path before
          // there is a circular dependency, fail if configured to do so.
          if (!handleCircular) {
            return {
              kind: 'CircularDependencyFailure',
              message: `"${key}" has circular dependency "${childkey}"`,
              value: { history }
            };
          }
          // Create a proxy and use that as a stand-in so that Circular Dependencies,
          // can be resolved. This assumes that the dependecies are not needed for the
          // creation of either value, as that would be impossible to resolve.
          const controller = handleCircular({});
          proxyPatches.push([
            {
              ...declaration,
              history: new Set(history),
              key: childkey
            },
            controller
          ]);
          lookup.set(childkey, Promise.resolve(controller.proxy));
        }
        const forkedHistory = new Set(history);
        forkedHistory.add(key);

        unvisited.add({
          history: forkedHistory,
          key: childkey,
          ...declaration
        });
      }
    }
  }
  // Work down the defered stack as they should now be resolveable in order
  let deferedCurrent: DependencyNode;

  if (defered.size()) {
    while (deferedCurrent = defered.remove()!) {
      // tryFulfill cannot fail at this point
      const result = tryFulfill(deferedCurrent, lookup, postProcess) as Success<Promise<any>>;
      lookup.set(deferedCurrent.key, result.value);
    }
  }
  return {
    kind: 'Success',
    proxyPatches
  };
};

export default resolveDependencies;
