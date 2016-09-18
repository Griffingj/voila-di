import mutableProxyFactory  from 'mutable-proxy';
import validateRegistration from './validation/validateRegistration';

export default function containerFactory() {
  const registry = new Map();

  function assemble(dependencies, registration) {
    const {
      factory,
      factoryWithCallback,
      factoryResolvePromise,
      constructorFunc,
    } = registration;

    if (factory) {
      try {
        return factory(...dependencies);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    if (factoryWithCallback) {
      return new Promise((resolve, reject) => {
        factoryWithCallback(...dependencies, (error, component) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(component);
        });
      });
    }

    if (factoryResolvePromise) {
      return factoryResolvePromise(...dependencies);
    }

    // Must be constructorFunc as register assertions will enforce this
    try {
      /* eslint new-cap: 0 */
      return new constructorFunc(...dependencies);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function resolveStep(key, circularRefs, ancestry) {
    const registration = registry.get(key);

    if (!registration) {
      const keyError = new Error(`Key "${key}" not found in registry`);
      return Promise.reject(keyError);
    }

    const {
      value,
      requirements = []
    } = registration;

    if (value) {
      return Promise.resolve(value);
    }

    // Resolve the dependencies of this key
    const depPromises = requirements.map(requirement => {
      // Return a proxy for circular dependencies, this will allow the
      // dependencies to resolve, and any proxys will be updated afterward to
      // forward to the correct objects
      const isCircular = ancestry.has(requirement);

      if (isCircular) {
        const { setTarget, proxy } = mutableProxyFactory();
        circularRefs.set(requirement, setTarget);
        return proxy;
      }
      ancestry.set(key, null);
      return resolveStep(requirement, circularRefs, ancestry);
    });

    const valuePromise = Promise.all(depPromises)
      .then(deps => assemble(deps, registration));

    ancestry.set(key, valuePromise);
    return valuePromise;
  }

  return {
    value(key, value) {
      return this.register({ key, value });
    },
    factory(key, factory, requirements) {
      const options = { key, requirements };

      if (factory.withCallback) {
        Object.assign(options, { factoryWithCallback: factory });
      } else if (factory.resolvePromise) {
        Object.assign(options, { factoryResolvePromise: factory });
      } else {
        Object.assign(options, { factory });
      }
      return this.register(options);
    },
    constructorFunc(key, constructorFunc, requirements) {
      return this.register({ key, constructorFunc, requirements });
    },
    register(registration) {
      validateRegistration(registration);
      registry.set(registration.key, registration);
      return this;
    },
    resolve(key) {
      const circularRefs = new Map();
      const ancestry = new Map();

      return resolveStep(key, circularRefs, ancestry)
        .then(value => {
          const patchPromises = [];

          circularRefs.forEach((setTarget, proxyKey) => {
            const valuePromise = ancestry
              .get(proxyKey)
              .then(setTarget);
            patchPromises.push(valuePromise);
          });
          return Promise.all(patchPromises).then(() => value);
        });
    }
  };
}
