import { script } from 'lab';
import { expect } from 'chai';
import flatten    from '../src/lib/flatten';

export const lab = script();
const { describe, it } = lab;

describe('flatten', () => {
  it('unwraps array items within an array', done => {
    const result = flatten([['a'], 'b', ['c']]);
    expect(result).to.eql(['a', 'b', 'c']);
    done();
  });

  it('unwraps only one level', done => {
    const result = flatten([[['a']]]);
    expect(result).to.eql([['a']]);
    done();
  });

  it('returns an eql array when source array has no array children', done => {
    const result = flatten(['a', 'b', 'c']);
    expect(result).to.eql(['a', 'b', 'c']);
    done();
  });
});
