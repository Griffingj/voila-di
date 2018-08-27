import { GraphLookup } from '../index';
import containerFactory from './containerFactory';
import { Container } from './containerFactory';
import { Options } from './containerFactory';
import ensureStrictGraph from './ensureStrictGraph';
import { StringIndexable } from './objects';

export default function looseContainerFactory(
  graph: StringIndexable = {},
  options?: Partial<Options>,
  graphLookup?: GraphLookup): Container {

  const strictGraph = ensureStrictGraph(graph);
  return containerFactory(strictGraph, options, graphLookup);
}
