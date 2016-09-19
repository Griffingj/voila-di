import assert from '../utility/assert';

export default function validateRegistration(registration) {
  const {
    key,
    value,
    factory,
    constructorFunc,
    factoryWithCallback,
    factoryResolvePromise,
    requirements
  } = registration;

  const prefix = `Registration "${JSON.stringify(registration)}" invalid,`;

  assert(key, `${prefix} key required`);

  const provider = [
    value,
    factory,
    factoryWithCallback,
    factoryResolvePromise,
    constructorFunc
  ].filter(item => item !== undefined)[0];

  assert(provider, `${prefix} one of [value, factory, constructor,` +
    ' factoryWithCallback, factoryResolvePromise] required');

  const valueNoReqs = !(value && requirements && requirements.length);
  assert(valueNoReqs, `${prefix} do not pass requirements when registering value`);

  const funcProviderIsFunc = provider === value || typeof provider === 'function';
  assert(funcProviderIsFunc, `${prefix} [factory, constructor,` +
    'factoryWithCallback, factoryResolvePromise] must be functions');
}
