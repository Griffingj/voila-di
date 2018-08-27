import { Result } from '../index';
import resultFactory from './resultFactory';

export interface ProxyController {
  proxy: any;
  setProxyTarget(target: any): Result<null>;
}

export type Proxify = (something: any) => ProxyController;

function isObject(value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

function proxyFactory(something: any) {
  const proxy = {};
  Object.setPrototypeOf(proxy, something);
  return proxy;
}

export default function proxify(something: any): ProxyController {
  const proxy = proxyFactory(something);

  return {
    proxy,
    setProxyTarget(target) {
      if (!isObject(target)) {
        return resultFactory(undefined, {
          kind: 'InvalidProxyTargetFailure',
          message: `Value must be an object to be proxified "${something}" is not an object.`
        });
      }
      Object.setPrototypeOf(proxy, target);

      return resultFactory({
        kind: 'Success',
        value: null
      });
    }
  };
}
