import { expect } from 'chai';
import { script } from 'lab';
import strictGraphToTree from '../src/lib/strictGraphToTree';
import * as Fixtures from './fixtures';

export const lab = script();
const { describe, it } = lab;

describe('strictGraphToTree', () => {
  it('converts a StrictGraph structure into a tree', () => {
    const result = strictGraphToTree(Fixtures.strictSingleFile);
    expect(result).to.deep.equal(Fixtures.strictSingleFileTree);
  });
});
