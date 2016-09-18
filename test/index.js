import expect from 'expect';
import Lab    from 'lab';
import voila  from '../src/index';

const lab = exports.lab = Lab.script();
const { describe, it, beforeEach } = lab;

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
      describe('two values whose providers depend directly on each other', () => {
        let diContainer;

        beforeEach(done => {
          diContainer = voila.create();
          diContainer.register({
            key: 'a',
            factory(b) {
              return {
                message() {
                  return `a["${b.forA()}"]`;
                },
                forB() {
                  return 'a.forB';
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
                  return `b["${a.forB()}"]`;
                },
                forA() {
                  return 'b.forA';
                }
              };
            },
            requirements: ['a']
          });
          done();
        });

        it('resolves the first correctly', () => {
          return diContainer.resolve('a').then(a => {
            expect(a.message()).toEqual('a["b.forA"]');
          });
        });

        it('resolves the second correctly', () => {
          return diContainer.resolve('b').then(b => {
            expect(b.message()).toEqual('b["a.forB"]');
          });
        });
      });

      describe('three values such that each provider is only depended on once', () => {
        let diContainer;

        beforeEach(done => {
          diContainer = voila.create();
          diContainer.register({
            key: 'a',
            factory(c) {
              return {
                message() {
                  return `a["${c.forA()}"]`;
                },
                forB() {
                  return 'a.forB';
                }
              };
            },
            requirements: ['c']
          });
          diContainer.register({
            key: 'b',
            factory(a) {
              return {
                message() {
                  return `b["${a.forB()}"]`;
                },
                forC() {
                  return 'b.forC';
                }
              };
            },
            requirements: ['a']
          });
          diContainer.register({
            key: 'c',
            factory(b) {
              return {
                message() {
                  return `c["${b.forC()}"]`;
                },
                forA() {
                  return 'c.forA';
                }
              };
            },
            requirements: ['b']
          });
          done();
        });

        it('resolves the first correctly', () => {
          return diContainer.resolve('a').then(a => {
            expect(a.message()).toEqual('a["c.forA"]');
          });
        });

        it('resolves the second correctly', () => {
          return diContainer.resolve('b').then(b => {
            expect(b.message()).toEqual('b["a.forB"]');
          });
        });

        it('resolves the third correctly', () => {
          return diContainer.resolve('c').then(c => {
            expect(c.message()).toEqual('c["b.forC"]');
          });
        });
      });
    });
  });
});
