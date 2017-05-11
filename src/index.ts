import containerFactory      from './lib/containerFactory';
import looseContainerFactory from './lib/looseContainerFactory';
import ensureStrictGraph     from './lib/ensureStrictGraph';
import strictGraphToTree     from './lib/strictGraphToTree';
import functionToParams      from './lib/functionToParams';

export default looseContainerFactory;

export {
  strictGraphToTree,
  ensureStrictGraph,
  functionToParams,
  containerFactory as strictFactory
};

export type Declaration = {
  dependencies?: string[];
  provider: Function;
};

export type DependencyNode = Declaration & {
  history: Set<string>
  key: string
};

export type GraphLookup = Map<string, Promise<any>>;

export type LooseGraph = {
  [key: string]: any
};

export type StrictGraph = {
  [key: string]: Declaration
};

export type Success<T> = {
  kind: 'Success';
  value: T;
};

export type FailureKind =
  'CircularDependencyFailure' |
  'MissingDependencyFailure' |
  'KeyClobberFailure' |
  'InvalidProxyTargetFailure';

export type Failure = {
  kind: FailureKind
  message: string
}

export type Result<T> = (Success<T> | Failure) & {
  orThrow(): T;
};
