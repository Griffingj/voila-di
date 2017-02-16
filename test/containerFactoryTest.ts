import { spy }           from 'sinon';
import { mock }          from 'sinon';
import { script }        from 'lab';
import { expect }        from 'chai';
import looseFactory      from '../src/index';
import { strictFactory } from '../src/index';
import * as Fixtures     from './fixtures';

export const lab = script();
const { describe, it } = lab;

describe('containerFactory', () => {
  describe('looseFactory', () => {
    it('returns a promise that resolves to a container, with a well formed graph', done => {
      expect(looseFactory()).to.be.ok;
      done();
    });

    describe('postProcess option', () => {
      it('allows a passed func to decorate the di objects', () => {
        const postProcess = spy(val => val);
        return looseFactory(Fixtures.funcSingleFile, { postProcess })
          .get('a')
          .then(val => expect(postProcess.callCount).to.eql(6));
      });
    });

    describe('the returned container', () => {
      describe('#get', () => {
        it('rejects with a circular dependency', () => {
          return looseFactory(Fixtures.funcSingleFile)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('rejects with an immediately missing dependency', () => {
          return looseFactory(Fixtures.funcSingleFile)
            .get('z')
            .catch(failure => expect(failure.kind).to.eql('MissingDependency'));
        });

        it('rejects with a downstream missing dependency', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .getSome('a')
            .catch(failure => expect(failure.kind).to.eql('MissingDependency'));
        });

        it('resolves a chain of function declarations', () => {
          return looseFactory(Fixtures.funcSingleFile)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves when a key has an undefined return value', () => {
          return looseFactory(Fixtures.funcSingleFileUndefinedVal)
            .get('a')
            .then(val => expect(val).to.eql(15));
        });

        it('resolves a chain of strict declarations', () => {
          return looseFactory(Fixtures.strictSingleFile)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a chain of func declarations with promises', () => {
          return looseFactory(Fixtures.funcSingleFilePromise)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a chain of strict declarations with promises', () => {
          return looseFactory(Fixtures.strictSingleFilePromises)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of func declarations', () => {
          return looseFactory(Fixtures.funcBroad)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of strict declarations', () => {
          return looseFactory(Fixtures.strictBroad)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of func declarations with promises', () => {
          return looseFactory(Fixtures.funcBroadPromises)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of strict declarations with promises', () => {
          return looseFactory(Fixtures.strictBroadPromises)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a mixed arrangement of mixed declarations', () => {
          return looseFactory(Fixtures.mixed)
            .get('a')
            .then(val => expect(val).to.eql(25));
        });
      });

      describe('#getSome', () => {
        it('resolves several dependencies', () => {
          return looseFactory(Fixtures.broadShortPromises)
            .getSome('a', 'b', 'c')
            .then(values => expect(values).to.eql({ a: 5, b: 7, c: 9 }));
        });

        it('rejects with an immediately missing dependency', () => {
          return looseFactory(Fixtures.broadShortPromises)
            .getSome('a', 'b', 'c', 'z')
            .catch(failure => expect(failure.kind).to.eql('MissingDependency'));
        });

        it('rejects with a downstream missing dependency', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .getSome('a')
            .catch(failure => expect(failure.kind).to.eql('MissingDependency'));
        });

        it('rejects with a circular dependency', () => {
          return looseFactory(Fixtures.broadShortPromises, { failOnClobber: false })
            .merge(Fixtures.strictPartialRightCircular)
            .value
            .getSome('a', 'b', 'c')
            .catch(failure => expect(failure.kind).to.eql('CircularDependency'));
        });
      });

      describe('#getAll', () => {
        it('resolves all dependencies', () => {
          return looseFactory(Fixtures.broadShortPromises)
            .getAll()
            .then(values => {
              expect(values).to.eql({
                a: 5, b: 7, c: 9, d: 4, e: 5, f: 6
              });
            });
        });

        it('rejects with a circular dependency', () => {
          return looseFactory(Fixtures.broadShortPromises, { failOnClobber: false })
            .merge(Fixtures.strictPartialRightCircular)
            .value
            .getAll()
            .catch(failure => expect(failure.kind).to.eql('CircularDependency'));
        });

        it('calls each provider once', () => {
          const graph = {
            a: (b, c) => 1,
            b: (c) => 2,
            c: () => 3
          };

          const mocked = mock(graph);
          mocked.expects('a').exactly(1);
          mocked.expects('b').exactly(1);
          mocked.expects('c').exactly(1);

          return looseFactory(graph).getAll().then(vals => mocked.verify());
        });
      });

      describe('#merge', () => {
        it('merges a graph into an existing container', () => {
          return looseFactory({ z: 20 })
            .merge(Fixtures.broadShortPromises)
            .value
            .getAll()
            .then(values => {
              expect(values).to.eql({
                a: 5, b: 7, c: 9, d: 4, e: 5, f: 6, z: 20
              });
            });
        });

        it('rejects on key clobber when configured', done => {
          const result = looseFactory({ a: 20 }).merge(Fixtures.broadShortPromises);
          expect(result.kind).to.eql('KeyClobberFailure');
          done();
        });

        it('allows key clobber when configured', () => {
          return looseFactory({ b: 20 })
            .setOptions({ failOnClobber: false })
            .merge(Fixtures.strictPartialRight)
            .value
            .get('b')
            .then(val => expect(val).to.eql(1));
        });
      });

      describe('#mergeStrict', () => {
        it('merges a strict graph into an existing container', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .mergeStrict(Fixtures.strictPartialRight)
            .value
            .get('a')
            .then(val => expect(val).to.eql(2));
        });

        it('rejects on key clobber when configured', done => {
          const result = looseFactory({ a: 20 }).mergeStrict(Fixtures.strictPartialLeft);
          expect(result.kind).to.eql('KeyClobberFailure');
          done();
        });

        it('allows key clobber when configured', () => {
          return looseFactory({ b: 20 }, { failOnClobber: false })
            .mergeStrict(Fixtures.strictPartialRight)
            .value
            .get('b')
            .then(val => expect(val).to.eql(1));
        });
      });
    });
  });

  describe('strict containerFactory', () => {
    it('returns a promise that resolves to a container', done => {
      expect(strictFactory()).to.be.ok;
      done();
    });

    describe('the returned container', () => {
      describe('#get', () => {
        it('resolves a chain of strict declarations', () => {
          return strictFactory(Fixtures.strictSingleFile)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a chain of strict declarations with promises', () => {
          return strictFactory(Fixtures.strictSingleFilePromises)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of strict declarations', () => {
          return strictFactory(Fixtures.strictBroad)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });

        it('resolves a broad arrangement of strict declarations with promises', () => {
          return strictFactory(Fixtures.strictBroadPromises)
            .get('a')
            .then(val => expect(val).to.eql(20));
        });
      });
    });
  });
});
