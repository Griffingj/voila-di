import validateRegistration    from './validation/validateRegistration';
import placeholderProxyFactory from './utility/placeholderProxyFactory';

export default function containerFactory() {
  const registry = new Map();

  function fulfill(dependencies, registration) {
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

    try {
      /* eslint new-cap: 0 */
      return new constructorFunc(...dependencies);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function resolveChildren(key, circularRefs, ancestry = []) {
    const registration = registry.get(key);

    if (!registration) {
      const keyError = new Error(`Key "${key}" not found in registry`);
      return Promise.reject(keyError);
    }

    const {
      value,
      requirements = [],
      resolver,
    } = registration;

    // If some other call to resolveChildren had already started the
    // resolution of this key, return that promise
    if (resolver) {
      return resolver;
    }

    if (value) {
      return Promise.resolve(value);
    }

    // Resolve the dependencies of this key
    const dependencyPromises = requirements.map(requirement => {
      // Return a proxy for circular dependencies, this will be patched after
      // the dependencies are resolved, otherwise the dependencies would never
      // resolve
      const isCircular = ancestry.indexOf(requirement) !== -1;

      if (isCircular) {
        const { proxy, setTarget } = mutableProxyFactory();
        circularRefs.set(requirement, setTarget);
        return proxy;
      }
      return resolveChildren(requirement, circularRefs, [...ancestry, key]);
    });

    const valuePromise = Promise.all(dependencyPromises)
      .then(dependencies => fulfill(dependencies, registration));

    // Add the promise to the registry's registration so that other async
    // calls to resolve this key reuse this promise
    registry.set(key, Object.assign(registration, {
      resolver: valuePromise
    }));

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

      return resolveChildren(key, circularRefs)
        .then(value => {
          circularRefs.forEach((setProxyTarget, proxyKey) => {
            registry
              .get(proxyKey).resolver
              .then(setProxyTarget);
          });
          return value;
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
