import { Declaration }     from '../index';
import { DependencyNode }  from '../index';
import { GraphLookup }     from '../index';
import { LooseGraph }      from '../index';
import { Result }          from '../index';
import { StrictGraph }     from '../index';
import { Success }         from '../index';
import ensureStrictGraph   from './ensureStrictGraph';
import strictGraphToTree   from './strictGraphToTree';
import resultFactory       from './resultFactory';
import proxify             from './proxify';
import { Proxify }         from './proxify';
import { ProxyController } from './proxify';

export type Options = {
  failOnClobber: boolean;
  handleCircular: Proxify | false;
  postProcess: (node: DependencyNode, value: any) => any;
}

export type TreeNode = {
  name: string;
  children: TreeNode[];
};

export type OnFulfill = ((some: any) => any) | undefined;
export type OnReject = (some: any) => any;

export type Container = {
  merge(otherGraph: LooseGraph): Result<Container>;
  mergeStrict(otherGraph: StrictGraph): Result<Container>;
  get(key: string): Promise<any>;
  getSome(...keys: string[]): Promise<{ [key: string]: any }>;
  getAll(): Promise<{ [key: string]: any }>;
  getTree(): TreeNode;
  getGraph(): StrictGraph;
  then(onFulfill: OnFulfill, onReject?: OnReject): Promise<any>;
  catch(onReject: OnReject): Promise<any>;
  setOptions(options: Partial<Options>): Container;
}

const defaultLibOpts: Options = {
  failOnClobber: true,
  handleCircular: proxify,
  postProcess: (node: DependencyNode, value: any) => value
};

export type InternalFailure<T> = {
  kind: 'Failure';
  value: T;
}

type FulfillResult = Success<Promise<any>> | InternalFailure<string[]>;

function tryFulfill(declaration: Declaration, lookup: GraphLookup): FulfillResult {
  const unfulfillable: string[] = [];
  const activeDeps: Promise<any>[] = [];
  const { dependencies, provider } = declaration;

  for (const key of dependencies!) {
    const promise = lookup.get(key);

    if (promise === undefined) {
      unfulfillable.push(key);
    } else {
      activeDeps.push(promise);
    }
  }

  // If the current node's dependencies are all in the lookup,
  // generate the promise and set it in the lookup
  const value = Promise
    .all(activeDeps)
    .then(results => provider.apply(undefined, results));

  if (!unfulfillable.length) {
    return { kind: 'Success', value };
  }

  return {
    kind: 'Failure',
    value: unfulfillable
  };
}

// Ensure that the value from a provider is postProcessed and wrapped in a promise
function wrap(node, value, options) {
  return Promise
    .resolve(value)
    .then(val => options.postProcess(node, value));
}

export default function containerFactory(
  graph: StrictGraph = {},
  libOptions?: Partial<Options>,
  graphLookup?: GraphLookup): Container {

  let options = {
    ...defaultLibOpts,
    ...libOptions
  };
  const lookup: GraphLookup = graphLookup ? new Map(graphLookup) : new Map();

  const container: Container = {
    merge(otherGraph: LooseGraph) {
      const strictGraph = ensureStrictGraph(otherGraph);
      return container.mergeStrict(strictGraph);
    },
    mergeStrict(otherGraph: StrictGraph) {
      const keys = Object.keys(otherGraph);
      let newGraph: StrictGraph;

      if (options.failOnClobber) {
        newGraph = {
          ...(graph as StrictGraph)
        };

        for (const key of keys) {
          if (key in newGraph) {
            return resultFactory(undefined, {
              kind: 'KeyClobberFailure',
              message: `"${key}" overloaded by merging graph`
            });
          }
          newGraph[key] = otherGraph[key];
        }
      } else {
        newGraph = {
          ...(graph as StrictGraph),
          ...(otherGraph as StrictGraph)
        };
      }

      return resultFactory({
        kind: 'Success',
        value: containerFactory(newGraph, options, lookup)
      });
    },
    get(requestedKey) {
      // If the key cannot be found in the graph, fail
      const maybeDeclaration = graph[requestedKey];

      if (!maybeDeclaration) {
        return Promise.reject({
          kind: 'MissingDependencyFailure',
          message: `Graph does not contain key "${requestedKey}"`
        });
      }
      // If the key has been looked up before, reuse that promise
      const maybePromise = lookup.get(requestedKey);

      if (maybePromise) {
        return maybePromise;
      }

      // This is used in the resolution of circular dependencies if configured
      type ProxyPatch = [Declaration, ProxyController];
      const proxyPatches: ProxyPatch[] = [];
      const { handleCircular } = options;

      // Use iterative depth first search to resolve the tree
      // of all dependencies for this key, and memoize it
      const first = {
        history: new Set(),
        key: requestedKey,
        ...maybeDeclaration
      };
      const unvisited: DependencyNode[] = [first];
      const defered: DependencyNode[] = [];

      let current: DependencyNode;

      while (current = unvisited.pop()!) {
        const {
          dependencies,
          history,
          key,
          provider
        } = current;

        // If the current node has no dependencies
        if (!dependencies || !dependencies.length) {
          const wrapped = wrap(current, provider(), options);
          lookup.set(key, wrapped);
          continue;
        }
        // Otherwise try to fulfill the declaration by checking each dependency
        const result = tryFulfill(current, lookup);

        if (result.kind === 'Success') {
          lookup.set(key, wrap(current, result.value, options));
        } else if (result.kind === 'Failure') {
          defered.push(current);
          const childkeys = result.value;

          for (const childkey of childkeys) {
            const declaration = graph[childkey];

            // If the current depKey cannot be found in the graph, fail
            if (!declaration) {
              return Promise.reject({
                kind: 'MissingDependencyFailure',
                message: `"${key}" required missing dependency "${childkey}"`
              });
            }

            if (history.has(childkey)) {
              // If the current dependency has been visited on this path before
              // there is a circular dependency, fail
              if (!handleCircular) {
                return Promise.reject({
                  kind: 'CircularDependencyFailure',
                  message: `"${key}" has circular dependency "${childkey}"`,
                  value: {
                    history: Array.from(history)
                  }
                });
              }
              // Create a proxy and use that as a stand-in so that Circular Dependencies,
              // can be resolved. This assumes that the dependecies are not needed for the
              // creation of either value, as that would be impossible to resolve.
              const controller = handleCircular({});
              proxyPatches.push([declaration, controller]);
              lookup.set(childkey, Promise.resolve(controller.proxy));
            }

            unvisited.push({
              history: new Set([...Array.from(history), key]),
              key: childkey,
              ...declaration
            });
          }
        }
      }
      // Unwind the defered as they should now all be resolveable
      let deferedCurrent: DependencyNode;

      if (defered.length) {
        while (deferedCurrent = defered.pop()!) {
          const result = tryFulfill(deferedCurrent, lookup);
          const wrapped = wrap(deferedCurrent, result.value, options);
          lookup.set(deferedCurrent.key,  wrapped);
        }
      }
      const proxyPatchPromises: Promise<any>[] = [];

      // If resolving circular dependencies, set all of the proxies to their respective correct values
      if (handleCircular && proxyPatches.length) {
        let i = proxyPatches.length - 1;

        while (i--) {
          const [declaration, controller] = proxyPatches[i];
          const result = tryFulfill(declaration, lookup) as Success<Promise<any>>;
          const promise = result.value;
          promise.then(val => {
            const result = controller.setProxyTarget(val);

            if (result.kind !== 'Success') {
              throw result;
            }
          });
          proxyPatchPromises.push(promise);
        }
      }

      return Promise
        .all(proxyPatchPromises)
        .then(() => lookup.get(requestedKey));
    },
    getSome(...keys) {
      return new Promise((resolve, reject) => {
        const mappedValues = {};
        const promises: Promise<any>[] = [];

        for (const key of keys) {
          const promise = container
            .get(key)
            .then(value => {
              mappedValues[key] = value;
            });

          promises.push(promise);
        }

        Promise
          .all(promises)
          .then(() => resolve(mappedValues))
          .catch(reject);
      });
    },
    getAll() {
      const allKeys = Object.keys(graph);
      return container.getSome(...allKeys);
    },
    getTree() {
      return strictGraphToTree(graph);
    },
    getGraph() {
      return { ...graph };
    },
    setOptions(optionsToMerge) {
      if (optionsToMerge) {
        options = { ...options, ...optionsToMerge };
      }
      // If passing nothing reset to original options
      else {
        options = { ...defaultLibOpts, ...libOptions };
      }
      return container;
    },
    // Make the container promise-like, when these are called, otherwise deliberately lazy
    then(onFulfill, onReject) {
      return container.getAll().then(onFulfill, onReject);
    },
    catch(onReject) {
      return container.then(undefined, onReject);
    }
  };
  return container;
}
