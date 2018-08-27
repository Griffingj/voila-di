import { expect } from 'chai';
import { script } from 'lab';
import { isObject } from '../src/lib/objects';

export const lab = script();
const { describe, it } = lab;

describe('isObject', () => {
  it('passes an object and not null', () => {
    expect(isObject(() => 5)).to.be.ok;
    expect(isObject([])).to.be.ok;
    expect(isObject({})).to.be.ok;
    expect(isObject(null)).to.not.be.ok;
  });
});
