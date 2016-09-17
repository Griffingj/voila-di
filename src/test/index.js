import expect from 'expect';
import Lab    from 'lab';
import voila  from '../index';

const lab = exports.lab = Lab.script();
const { describe, it } = lab;

describe('voila', () => {
  describe('#create', () => {
    it('returns a dependency injection container', done => {
      const diContainer = voila.create();
      expect(diContainer.register).toExist();
      expect(diContainer.resolve).toExist();
      done();
    });
  });

  describe('dependency injection container', () => {
    describe('circular reference', () => {
      it('resolves correctly', () => {
        const diContainer = voila.create();

        diContainer.register({
          key: 'a',
          factory(b) {
            return {
              message() {
                return `In a with b.message(): "${b.message()}"`;
              },
              forB() {
                return 'hello';
              }
            };
          },
          requirements: ['b']
        });

        diContainer.register({
          key: 'b',
          factory(a) {
            return {
              message() {
                return `In b with a.forB(): ${a.forB()}`;
              }
            };
          },
          requirements: ['a']
        });

        return diContainer.resolve('a').then(a => {
          expect(a.message()).toExist();
        });
      });
    });
  });
});
