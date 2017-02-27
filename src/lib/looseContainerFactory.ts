import ensureStrictGraph from './ensureStrictGraph';
import containerFactory  from './containerFactory';
import { Container }     from '../index';
import { LooseGraph }    from '../index';
import { Options }       from '../index';
import { GraphLookup }   from '../index';

export default function looseContainerFactory(
  graph: LooseGraph = {},
  options?: Options,
  graphLookup?: GraphLookup): Container {

  const strictGraph = ensureStrictGraph(graph);
  return containerFactory(strictGraph, options, graphLookup);
}
