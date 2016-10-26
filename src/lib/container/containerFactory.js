import provision            from './provision';
import validateRegistration from '../validation/validateRegistration';

function circularCheck(resolveStep) {
  return (key, ancestry = []) => {
    const isCircular = ancestry.indexOf(key) !== -1;

    if (isCircular) {
      const readableAncestry = [...ancestry.slice(ancestry.indexOf(key)), key].join(' => ');
      const error = new Error(`"${key}" has circular dependency, ancestry: ${readableAncestry}`);
      return Promise.reject(error);
    }
    return resolveStep(key, ancestry);
  };
}

export default function containerFactory(options = {}) {
  const {
    provisionDecorator = value => value,
    resolveStepDecorator = circularCheck
  } = options;

  const registry = new Map();
  const resolved = new Map();

  const decoratedProvision = provisionDecorator(provision);
  const decoratedResolveStep = resolveStepDecorator((key, ancestry = []) => {
    if (resolved.has(key)) {
      return Promise.resolve(resolved.get(key));
    }
    const registration = registry.get(key);

    if (!registration) {
      const keyError = new Error(`Key "${key}" not found in registry`);
      return Promise.reject(keyError);
    }
    const { requirements = [] } = registration;

    // Resolve the dependencies of this key
    const dependencyPromises = requirements.map(requirement => {
      return decoratedResolveStep(requirement, [...ancestry, key]);
    });

    return Promise.all(dependencyPromises).then(dependencies => {
      const value = decoratedProvision(registration, dependencies);
      resolved.set(key, value);
      return value;
    });
  });

  return {
    value(key, value) {
      return this.register({ key, value });
    },
    factory(key, factory, requirements) {
      const registration = { key, requirements };

      if (factory.withCallback) {
        Object.assign(registration, { factoryWithCallback: factory });
      } else if (factory.resolvePromise) {
        Object.assign(registration, { factoryResolvePromise: factory });
      } else {
        Object.assign(registration, { factory });
      }
      return this.register(registration);
    },
    constructorFunc(key, constructorFunc, requirements) {
      return this.register({ key, constructorFunc, requirements });
    },
    register(registration) {
      validateRegistration(registration);

      const { key, value } = registration;
      registry.set(key, registration);

      if (value) {
        resolved.set(key, value);
      }
      return this;
    },
    resolve(key) {
      return decoratedResolveStep(key);
    },
    meta() {
      return {
        registeredKeys: [...registry.keys()],
        resolvedKeys: [...resolved.keys()]
      };
    }
  };
}
