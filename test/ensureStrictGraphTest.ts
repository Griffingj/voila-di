import { expect } from 'chai';
import { script } from 'lab';
import ensureStrictGraph from '../src/lib/ensureStrictGraph';
import * as Fixtures from './fixtures';

export const lab = script();
const { describe, it } = lab;

export function isStrict(declaration) {
  const { dependencies, provider } = declaration;
  return (!dependencies || dependencies instanceof Array) &&
    provider instanceof Function;
}

describe('ensureStrictGraph', () => {
  it('coerces a loose graph into a strict one', () => {
    const maybeStrict = ensureStrictGraph(Fixtures.mixed);
    let nonStrict = false;

    for (const key of Object.keys(maybeStrict)) {
      if (!isStrict(maybeStrict[key])) {
        nonStrict = true;
      }
    }
    expect(nonStrict).to.be.false;
  });
});
