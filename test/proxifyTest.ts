import { assert, expect } from 'chai';
import { script } from 'lab';
import proxify from '../src/lib/proxify';

export const lab = script();
const { describe, it } = lab;

describe('proxify', () => {
  it('provides an interface for swapping out a proxy', () => {
    const a = { get: () => 2 };
    const b = { get: () => 3 };
    const controller = proxify(a);

    assert(a !== controller.proxy);
    assert(a.get() === controller.proxy.get());

    controller.setProxyTarget(b);
    assert(a.get() !== controller.proxy.get());
  });

  it('must be passed an object', () => {
    try {
      proxify(4);
    } catch (thrown) {
      expect(thrown).to.be.ok;
    }

    try {
      const proxy = proxify({});
      proxy.setProxyTarget(4);
    } catch (thrown) {
      expect(thrown).to.be.ok;
    }
  });
});
