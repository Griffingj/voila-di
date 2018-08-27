import { DependencyNode } from '../index';
import { StrictGraph } from '../index';
import { GraphLookup } from '../index';
import { Result } from '../index';
import ensureStrictGraph from './ensureStrictGraph';
import { StringIndexable } from './objects';
import proxify from './proxify';
import { Proxify } from './proxify';
import { ProxyPatches } from './resolveDependencies';
import resolveDependencies from './resolveDependencies';
import resultFactory from './resultFactory';
import strictGraphToTree from './strictGraphToTree';

export type HandleCircular = Proxify | false;

export interface Options {
  failOnClobber: boolean;
  handleCircular: HandleCircular;
  postProcess: (node: DependencyNode, value: any) => any;
}

export interface TreeNode {
  name: string;
  children: TreeNode[];
}

export type OnFulfill = ((some: any) => any) | undefined;
export type OnReject = (some: any) => any;
export interface KeyedResult { [key: string]: any; }

export interface Container {
  merge(otherGraph: StringIndexable): Result<Container>;
  mergeStrict(otherGraph: StrictGraph): Result<Container>;
  get(key: string): Promise<any>;
  getSome(...keys: string[]): Promise<KeyedResult>;
  getAll(): Promise<KeyedResult>;
  getTree(): TreeNode;
  getGraph(): StrictGraph;
  then(onFulfill: OnFulfill, onReject?: OnReject): Promise<any>;
  catch(onReject: OnReject): Promise<any>;
  setOptions(options?: Partial<Options>): Container;
  inspectOptions(): Partial<Options>;
}

const defaultLibOpts: Options = {
  failOnClobber: true,
  handleCircular: proxify,
  postProcess: (node: DependencyNode, value: any) => value
};

function patchCircular(
  lookup: Map<string, any>,
  handleCircular: HandleCircular,
  proxyPatches: ProxyPatches) {

  const proxyPatchPromises: Array<Promise<any>> = [];

  // If resolving circular dependencies, set all of the proxies to their respective correct values
  if (handleCircular && proxyPatches.length) {
    let i = proxyPatches.length - 1;

    while (i--) {
      const [node, controller] = proxyPatches[i];
      const promise = lookup.get(node.key)!;

      promise.then(val => {
        const result = controller.setProxyTarget(val);

        if (result.kind !== 'Success') {
          throw result;
        }
      });
      proxyPatchPromises.push(promise);
    }
  }
  return Promise.all(proxyPatchPromises);
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
    merge(otherGraph: StringIndexable) {
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
            return resultFactory<Container>(undefined, {
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

      return resultFactory(containerFactory(newGraph, options, lookup));
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
      const { handleCircular, postProcess } = options;

      const resolveResult = resolveDependencies(requestedKey,
        maybeDeclaration,
        graph,
        handleCircular,
        postProcess,
        // Will mutate
        lookup);

      let proxyPatches: ProxyPatches = [];

      switch (resolveResult.kind) {
        case 'MissingDependencyFailure':
        case 'CircularDependencyFailure':
          return Promise.reject(resolveResult);
        case 'Success': {
          proxyPatches = resolveResult.proxyPatches;
        }
      }

      if (handleCircular) {
        return patchCircular(lookup, handleCircular, proxyPatches)
          .then(() => lookup.get(requestedKey));
      }
      return lookup.get(requestedKey)!;
    },
    getSome(...keys) {
      const mappedValues = {};
      const promises: Array<Promise<any>> = [];

      for (const key of keys) {
        const promise = container
          .get(key)
          .then(value => {
            mappedValues[key] = value;
          });

        promises.push(promise);
      }

      return Promise.all(promises).then(() => mappedValues);
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
    inspectOptions() {
      return { ...options };
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
