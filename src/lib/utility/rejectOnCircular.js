import { CircularReferenceError } from '../errors';

export default function rejectOnCircular(resolveStep) {
  return (key, ancestry = []) => {
    const isCircular = ancestry.indexOf(key) !== -1;

    if (isCircular) {
      const readableAncestry = [...ancestry.slice(ancestry.indexOf(key)), key].join(' => ');
      const message = `"${key}" has circular dependency, ancestry: ${readableAncestry}`;
      return Promise.reject(new CircularReferenceError(message));
    }
    return resolveStep(key, ancestry);
  };
}
