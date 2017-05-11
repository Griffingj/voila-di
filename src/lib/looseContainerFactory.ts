import { LooseGraph }    from '../index';
import { GraphLookup }   from '../index';
import ensureStrictGraph from './ensureStrictGraph';
import containerFactory  from './containerFactory';
import { Container }     from './containerFactory';
import { Options }       from './containerFactory';

export default function looseContainerFactory(
  graph: LooseGraph = {},
  options?: Partial<Options>,
  graphLookup?: GraphLookup): Container {

  const strictGraph = ensureStrictGraph(graph);
  return containerFactory(strictGraph, options, graphLookup);
}
