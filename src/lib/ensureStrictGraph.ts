import { Declaration }  from '../index';
import { LooseGraph }   from '../index';
import { StrictGraph }  from '../index';
import functionToParams from './functionToParams';

function parseFunc(func: Function): Declaration {
  return {
    dependencies: functionToParams(func),
    provider: func,
  };
}

export default function ensureStrictGraph(graph: LooseGraph): StrictGraph {
  const strictGraph: StrictGraph = {};
  const keys = Object.keys(graph);

  for (const key of keys) {
    const looseDeclare = graph[key];
    const { dependencies, provider } = looseDeclare;

    const isStrictDeclare =
      (!dependencies || dependencies instanceof Array) &&
      provider instanceof Function;

    // If the declaration is strict pass it on directly
    if (isStrictDeclare) {
      strictGraph[key] = looseDeclare as Declaration;
    }
    // If the declaration is a function try to parse it based on
    // the convention that the name of the function will be the key,
    // the names of the parameters will be the dependencies,
    // and the function itself will be the provider
    else if (typeof looseDeclare === 'function') {
      strictGraph[key] = parseFunc(looseDeclare);
    }
    // Otherwise use the value directly
    else {
      strictGraph[key] = { provider: () => looseDeclare };
    }
  }
  return strictGraph;
}
