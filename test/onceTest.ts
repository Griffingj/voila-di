import { spy }    from 'sinon';
import { script } from 'lab';
import { expect } from 'chai';
import once       from '../src/lib/once';

export const lab = script();
const { describe, it } = lab;

describe('flatten', () => {
  it('only calls the passed function once', done => {
    const func = spy();
    const out = once(func);
    let i = 100;
    while (i--) { out(); }
    expect(func.calledOnce).to.be.ok;
    done();
  });
});
