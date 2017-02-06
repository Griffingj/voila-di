import { script }        from 'lab';
import { expect }        from 'chai';
import ensureStrictGraph from '../src/lib/ensureStrictGraph';
import * as Fixtures     from './fixtures';

export const lab = script();
const { describe, it } = lab;

function isStrict(key, declaration) {
  const { dependencies, provider } = declaration;
  return (!dependencies || dependencies instanceof Array) &&
    provider instanceof Function;
}

describe('ensureStrictGraph', () => {
  it('coerces a loose graph into a strict one', done => {
    const maybeStrict = ensureStrictGraph(Fixtures.mixed);
    let nonStrict = false;

    for (const key of Object.keys(maybeStrict)) {
      if (!isStrict(key, maybeStrict[key])) {
        nonStrict = true;
      }
    }
    expect(nonStrict).to.be.false;
    done();
  });
});
