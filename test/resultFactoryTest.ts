import { expect } from 'chai';
import { script } from 'lab';
import resultFactory from '../src/lib/resultFactory';

export const lab = script();
const { describe, it } = lab;

describe('resultFactory', () => {
  describe('#orThrow', () => {
    it('returns the value when a success', () => {
      const result = resultFactory(5);
      expect(result.orThrow()).to.eql(5);
    });

    it('throws on failure', () => {
      const result = resultFactory(undefined, 5);

      try {
        result.orThrow();
      } catch (thrown) {
        expect(thrown).to.eql(5);
      }
    });
  });
});
