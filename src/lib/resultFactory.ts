import { Success } from '../index';

export default function resultFactory<T>(success: Success<T> | undefined, failure?: any) {
  const partial = {
    orThrow(): T {
      if (failure) {
        throw failure;
      }
      return success!.value;
    }
  };

  if (success) {
    return {
      ...partial,
      ...success
    };
  }

  return {
    ...partial,
    ...failure
  };
}
