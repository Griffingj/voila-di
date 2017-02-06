import ensureStrictGraph from './ensureStrictGraph';
import containerFactory  from './containerFactory';
import { Container }     from './types';
import { LooseGraph }    from './types';
import { Options }       from './types';
import { GraphLookup }   from './types';

export default function looseContainerFactory(
  graph: LooseGraph = {},
  options?: Options,
  graphLookup?: GraphLookup): Container {

  const strictGraph = ensureStrictGraph(graph);
  return containerFactory(strictGraph, options, graphLookup);
}
