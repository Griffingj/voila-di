import mutableProxyFactory  from 'mutable-proxy';
import assemble             from './assemble';
import validateRegistration from '../validation/validateRegistration';

export default function containerFactory(options = {}) {
  const {
    postProcess = value => value
  } = options;

  const registry = new Map();
  const resolved = new Map();

  function resolveStep(key, circularMeta, ancestry = []) {
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
      // Return a proxy for circular dependencies, this will allow the
      // dependencies to resolve, and any proxys will be updated afterward to
      // forward to the correct objects
      const isCircular = ancestry.indexOf(requirement) !== -1;

      if (isCircular) {
        const { setTarget, proxy } = mutableProxyFactory();
        circularMeta.set(requirement, setTarget);
        return proxy;
      }
      return resolveStep(requirement, circularMeta, [...ancestry, key]);
    });

    return Promise.all(dependencyPromises).then(dependencies => {
      const value = postProcess(assemble(dependencies, registration));
      resolved.set(key, value);
      return value;
    });
  }

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
      const circularMeta = new Map();

      return resolveStep(key, circularMeta).then(value => {
        circularMeta.forEach((setTarget, proxyKey) => {
          setTarget(resolved.get(proxyKey));
        });
        return value;
      });
    },
    meta() {
      return {
        registeredKeys: [...registry.keys()],
        resolvedKeys: [...resolved.keys()]
      };
    }
  };
}
