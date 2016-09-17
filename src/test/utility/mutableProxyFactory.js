import expect              from 'expect';
import Lab                 from 'lab';
import mutableProxyFactory from '../../lib/utility/mutableProxyFactory';

const lab = exports.lab = Lab.script();
const { describe, it, beforeEach } = lab;

describe('mutableProxy', () => {
  it('should proxy a field access', done => {
    const { proxy, setTarget } = mutableProxyFactory();
    setTarget({ a: 1 });
    expect(proxy.a).toBe(1);
    done();
  });

  it('should proxy a function', done => {
    const { proxy, setTarget } = mutableProxyFactory();
    setTarget(() => 5);
    expect(proxy()).toBe(5);
    done();
  });

  describe('after having changed target', () => {
    let changedProxy;
    let setTarget;

    beforeEach(done => {
      const controller = mutableProxyFactory();
      setTarget = controller.setTarget;
      setTarget({ q: 'quadriceps' });
      changedProxy = controller.proxy;
      done();
    });

    it('should proxy a field access', done => {
      setTarget({ a: 1 });
      expect(changedProxy.a).toBe(1);
      done();
    });

    it('should proxy a function', done => {
      setTarget(() => 5);
      expect(changedProxy()).toBe(5);
      done();
    });
  });
});
