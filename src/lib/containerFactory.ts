import { Container }      from './types';
import { Declaration }    from './types';
import { DependencyNode } from './types';
import { GraphLookup }    from './types';
import { LooseGraph }     from './types';
import { Options }        from './types';
import { Result }         from './types';
import { StrictGraph }    from './types';
import ensureStrictGraph  from './ensureStrictGraph';

const defaultLibOpts = {
  failOnClobber: true,
  postProcess: (node: DependencyNode, value: any) => value
};

type FulfillResult = Result<Promise<any>, string[]>;

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
  if (!unfulfillable.length) {
    return {
      kind: 'Success',
      value: Promise.all(activeDeps).then(results => provider.apply(undefined, results))
    };
  }

  return {
    kind: 'Failure',
    value: unfulfillable
  };
}

export default function containerFactory(
  graph: StrictGraph = {},
  libOptions?: Options,
  graphLookup?: GraphLookup): Container {

  let options = { ...defaultLibOpts, ...libOptions };
  const lookup: GraphLookup = graphLookup ? new Map(graphLookup) : new Map();

  // Ensure that the value from a provider is postProcessed and wrapped in a promise
  function wrap(node, value) {
    return Promise
      .resolve(value)
      .then(val => options.postProcess(node, value));
  }

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
            return {
              kind: 'KeyClobberFailure',
              message: `"${key}" overloaded by merging graph`
            };
          }
          newGraph[key] = otherGraph[key];
        }
      } else {
        newGraph = {
          ...(graph as StrictGraph),
          ...(otherGraph as StrictGraph)
        };
      }

      return {
        kind: 'Success',
        value: containerFactory(newGraph, options, lookup)
      };
    },
    get(requestedKey) {
      // If the key cannot be found in the graph, fail
      const maybeDeclaration = graph[requestedKey];

      if (!maybeDeclaration) {
        return Promise.reject({
          kind: 'MissingDependency',
          message: `Graph does not contain key "${requestedKey}"`
        });
      }
      // If the key has been looked up before, reuse that promise
      const maybePromise = lookup.get(requestedKey);

      if (maybePromise) {
        return maybePromise;
      }

      // Use iterative breadth first search to resolve the tree of all dependencies for this key
      return new Promise((resolve, reject) => {
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

          // The current node has no dependencies
          if (!dependencies || !dependencies.length) {
            lookup.set(key, wrap(current, provider()));
            continue;
          }
          // Otherwise try to fulfill the declaration by checking the status of it's dependencies
          const result = tryFulfill(current, lookup);

          if (result.kind === 'Success') {
            lookup.set(key, wrap(current, result.value));
          } else if (result.kind === 'Failure') {
            defered.push(current);
            const depkeys = result.value;

            for (const depKey of depkeys) {
              const declaration = graph[depKey];

              // If the current depKey cannot be found in the graph, fail
              if (!declaration) {
                reject({
                  kind: 'MissingDependency',
                  message: `"${key}" required missing dependency "${depKey}"`
                });
                return;
              }

              // If the current dependency has been visited on this path before
              // there is a circular dependency, fail
              if (history.has(depKey)) {
                reject({
                  kind: 'CircularDependency',
                  message: `"${key}" has circular dependency "${depKey}"`,
                  value: {
                    history: Array.from(history)
                  }
                });
                return;
              }

              unvisited.push({
                history: new Set([...Array.from(history), key]),
                key: depKey,
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
            lookup.set(deferedCurrent.key, wrap(deferedCurrent, result.value) as Promise<any>);
          }
        }
        resolve(lookup.get(requestedKey));
      });
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
    setOptions(optionsToMerge) {
      if (optionsToMerge) {
        options = { ...options, ...optionsToMerge };
      }
      // If passing nothing reset to original options
      else {
        options = { ...defaultLibOpts, ...libOptions };
      }
      return container;
    }
  };
  return container;
}
