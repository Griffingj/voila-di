import expect from 'expect';
import Lab    from 'lab';
import voila  from '../src/index';

const lab = exports.lab = Lab.script();
const { describe, it, beforeEach } = lab;

describe('voila-di', () => {
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
      let diContainer;

      beforeEach(done => {
        diContainer = voila.create();
        diContainer.register({
          key: 'a',
          factory(b) { return 'a'; },
          requirements: ['b']
        });
        diContainer.register({
          key: 'b',
          factory(a) { return 'b'; },
          requirements: ['a']
        });
        done();
      });

      it('should return a rejected promise', () => {
        return diContainer.resolve('a').catch(error => {
          expect(error).toBeTruthy();
        });
      });
    });
  });
});
