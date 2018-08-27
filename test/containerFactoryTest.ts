import { expect } from 'chai';
import { script } from 'lab';
import { spy } from 'sinon';
import { mock } from 'sinon';
import looseFactory from '../src/index';
import { strictFactory } from '../src/index';
import * as Fixtures from './fixtures';

export const lab = script();
const { describe, it } = lab;

describe('containerFactory', () => {
  describe('looseFactory', () => {
    it('returns a promise that resolves to a container, with a well formed graph', () => {
      expect(looseFactory()).to.be.ok;
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
        describe('when handleCircular false', () => {
          it('rejects with a circular dependency', async () => {
            try {
              await looseFactory(Fixtures.strictPartialRightCircular, {
                handleCircular: false
              });
            } catch (thrown) {
              expect(thrown).to.have.property('kind', 'CircularDependencyFailure');
            }
          });
        });

        describe('when handleCircular using default', () => {
          it('resolves resolvable circular dependency', async () => {
            const { a, b, c } = await looseFactory(Fixtures.simpleCircularResolve);
            expect(a.do()).to.eql(3);
            expect(b.do()).to.eql(4);
            expect(c.do()).to.eql(2);
          });
        });

        it('rejects with an immediately missing dependency', () => {
          return looseFactory(Fixtures.funcSingleFile)
            .get('z')
            .catch(failure => expect(failure.kind).to.eql('MissingDependencyFailure'));
        });

        it('rejects with a downstream missing dependency', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .getSome('a')
            .catch(failure => expect(failure.kind).to.eql('MissingDependencyFailure'));
        });

        it('resolves a chain of function declarations', async () => {
          const { a } = await looseFactory(Fixtures.funcSingleFile);
          expect(a).to.eql(20);
        });

        it('rejects a chain of function declarations with a sync throw', async () => {
          const error = {};

          const promise = looseFactory({
            ...Fixtures.funcSingleFile,
            c: (d) => { throw error; },
          });

          return promise.catch(thrown => {
            expect(thrown).to.eql(error);
          });
        });

        it('resolves when a key has an undefined return value', async () => {
          const { a } = await looseFactory(Fixtures.funcSingleFileUndefinedVal);
          expect(a).to.eql(15);
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
            .catch(failure => expect(failure.kind).to.eql('MissingDependencyFailure'));
        });

        it('rejects with a downstream missing dependency', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .getSome('a')
            .catch(failure => expect(failure.kind).to.eql('MissingDependencyFailure'));
        });

        describe('when handleCircular false', () => {
          it('rejects with a circular dependency', () => {
            const container = looseFactory(Fixtures.broadShortPromises, {
              failOnClobber: false,
              handleCircular: false
            });

            return container
              .merge(Fixtures.strictPartialRightCircular)
              .orThrow()
              .getSome('a', 'b', 'c')
              .catch(failure => expect(failure.kind).to.eql('CircularDependencyFailure'));
          });
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

        describe('when handleCircular false', () => {
          it('rejects with a circular dependency', () => {
            const container = looseFactory(Fixtures.broadShortPromises, {
              failOnClobber: false,
              handleCircular: false,
            });

            return container
              .merge(Fixtures.strictPartialRightCircular)
              .orThrow()
              .getAll()
              .catch(failure => expect(failure.kind).to.eql('CircularDependencyFailure'));
          });
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
            .orThrow()
            .getAll()
            .then(values => {
              expect(values).to.eql({
                a: 5, b: 7, c: 9, d: 4, e: 5, f: 6, z: 20
              });
            });
        });

        it('rejects on key clobber when configured', () => {
          const result = looseFactory({ a: 20 }).merge(Fixtures.broadShortPromises);
          expect(result.kind).to.eql('KeyClobberFailure');
        });

        it('allows key clobber when configured', () => {
          return looseFactory({ b: 20 })
            .setOptions({ failOnClobber: false })
            .merge(Fixtures.strictPartialRight)
            .orThrow()
            .get('b')
            .then(val => expect(val).to.eql(1));
        });
      });

      describe('#mergeStrict', () => {
        it('merges a strict graph into an existing container', () => {
          return looseFactory(Fixtures.strictPartialLeft)
            .mergeStrict(Fixtures.strictPartialRight)
            .orThrow()
            .get('a')
            .then(val => expect(val).to.eql(2));
        });

        it('rejects on key clobber when configured', () => {
          const result = looseFactory({ a: 20 }).mergeStrict(Fixtures.strictPartialLeft);
          expect(result.kind).to.eql('KeyClobberFailure');
        });

        it('allows key clobber when configured', () => {
          return looseFactory({ b: 20 }, { failOnClobber: false })
            .mergeStrict(Fixtures.strictPartialRight)
            .orThrow()
            .get('b')
            .then(val => expect(val).to.eql(1));
        });
      });

      describe('#getGraph', () => {
        it('returns a graph identical to the one used to create the container', () => {
          const graph = strictFactory(Fixtures.strictSingleFile).getGraph();
          expect(graph).to.deep.equal(Fixtures.strictSingleFile);
        });
      });

      describe('#getTree', () => {
        it('returns a graph identical to the one used to create the container', () => {
          const tree = strictFactory(Fixtures.strictSingleFile).getTree();
          expect(tree).to.deep.equal(Fixtures.strictSingleFileTree);
        });
      });
    });
  });

  describe('strict containerFactory', () => {
    it('returns a promise that resolves to a container', () => {
      expect(strictFactory()).to.be.ok;
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
