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

export type Options = Partial<{
  failOnClobber: boolean;
  postProcess: (node: DependencyNode, value: any) => any;
}>

export type Container = {
  merge(otherGraph: LooseGraph): Result<Container, undefined>;
  mergeStrict(otherGraph: StrictGraph): Result<Container, undefined>;
  get(key: string): Promise<any>;
  getSome(...keys: string[]): Promise<{ [key: string]: any }>;
  getAll(): Promise<{ [key: string]: any }>;
  setOptions(options: Partial<Options>): Container;
}

export type Success<T> = {
  kind: 'Success';
  value: T;
};

export type ExposedFailureKind = 'CircularDependency' | 'MissingDependency' | 'KeyClobberFailure';

export type ExposedFailure<F> = {
  kind: ExposedFailureKind
  message: string,
  value?: F
}

export type Failure<F> = {
  kind: 'Failure';
  value: F;
}

export type Result<T, F> = Success<T> | Failure<F> | ExposedFailure<F>;
