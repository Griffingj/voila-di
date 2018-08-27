import containerFactory from './lib/containerFactory';
import ensureStrictGraph from './lib/ensureStrictGraph';
import { CommonFunction } from './lib/functions';
import functionToParams from './lib/functionToParams';
import looseContainerFactory from './lib/looseContainerFactory';
import strictGraphToTree from './lib/strictGraphToTree';

export default looseContainerFactory;

export {
  strictGraphToTree,
  ensureStrictGraph,
  functionToParams,
  containerFactory as strictFactory
};

export interface Declaration {
  dependencies?: string[];
  provider: CommonFunction;
}

export type DependencyNode = Declaration & {
  history: Set<string>
  key: string
};

export type GraphLookup = Map<string, Promise<any>>;

export interface StrictGraph {
  [key: string]: Declaration;
}

export interface Success<T> {
  kind: 'Success';
  value: T;
}

export type FailureKind =
  'CircularDependencyFailure' |
  'MissingDependencyFailure' |
  'KeyClobberFailure' |
  'InvalidProxyTargetFailure';

export interface Failure {
  kind: FailureKind;
  message: string;
}

export type Result<T> = (Success<T> | Failure) & {
  orThrow(): T;
};
