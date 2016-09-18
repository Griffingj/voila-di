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
      // Return a proxy for circular dependencies, this will be patched after
      // the dependencies are resolved, otherwise the dependencies would never
      // resolve
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
    },
    delete(key) {
      // TODO Warn if other's depend on this
      return registry.delete(key);
    },
    toJson() {
      return JSON.stringifiy(registry);
    }
  };
}
