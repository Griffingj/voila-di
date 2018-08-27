import { Result } from '../index';

export default function resultFactory<T>(successValue: T | undefined, failure?: any): Result<T> {
  const partial = {
    orThrow(): T {
      if (failure) {
        throw failure;
      }
      return successValue!;
    }
  };

  if (successValue) {
    return {
      ...partial,
      kind: 'Success',
      value: successValue
    };
  }

  return {
    ...partial,
    ...failure
  };
}
