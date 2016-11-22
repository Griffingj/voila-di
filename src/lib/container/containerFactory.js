import provision            from './provision';
import rejectOnCircular     from '../utility/rejectOnCircular';
import validateRegistration from '../validation/validateRegistration';
import ImproperUsageError   from '../errors';

export default function containerFactory(options = {}) {
  const {
    extendProvision = x => x,
    extendResolveStep = rejectOnCircular
  } = options;

  const registry = new Map();
  const resolved = new Map();

  const extendedProvision = extendProvision(provision);
  const extendedResolveStep = extendResolveStep((key, ancestry = []) => {
    if (resolved.has(key)) {
      return resolved.get(key);
    }
    const registration = registry.get(key);

    if (!registration) {
      const keyError = new ImproperUsageError(`Key "${key}" not found in registry`);
      return Promise.reject(keyError);
    }
    const { requirements = [] } = registration;

    // Recursively resolve dependencies
    const dependencyPromises = requirements.map(requirement => {
      return extendedResolveStep(requirement, ancestry.concat(key));
    });

    return Promise.all(dependencyPromises).then(dependencies => {
      const promise = extendedProvision(registration, dependencies);
      resolved.set(key, promise);
      return promise;
    });
  });

  return {
    register(registration) {
      validateRegistration(registration);

      const { key, value } = registration;
      registry.set(key, registration);

      if (value) {
        resolved.set(key, Promise.resolve(value));
      }
      return this;
    },
    resolve(key) {
      return extendedResolveStep(key);
    },
    meta() {
      return {
        registeredKeys: [...registry.keys()],
        resolvedKeys: [...resolved.keys()]
      };
    }
  };
}
