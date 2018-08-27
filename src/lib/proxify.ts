import { Result } from '../index';
import { isObject } from './objects';
import resultFactory from './resultFactory';

export interface ProxyController<T> {
  proxy: T;
  setProxyTarget(target: T): Result<T>;
}

export type Proxify = (something: any) => ProxyController<any>;

export default function proxify<T extends {}>(anObject: T): ProxyController<T> {
  const proxy: T = {} as any;

  const controller = {
    proxy,
    setProxyTarget(target) {
      if (!isObject(target)) {
        return resultFactory(undefined, {
          kind: 'InvalidProxyTargetFailure',
          message: `The target of a proxy must be an object.`
        }) as any;
      }
      Object.setPrototypeOf(proxy, target);
      return resultFactory(proxy);
    }
  };
  controller.setProxyTarget(anObject).orThrow();
  return controller;
}
