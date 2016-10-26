export default function provision(registration, dependencies) {
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
