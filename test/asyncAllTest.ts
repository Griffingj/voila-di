/* tslint:disable:no-empty */
/* tslint:disable:whitespace */
import { script } from 'lab';
import { expect } from 'chai';
import { Task }   from '../src/lib/asyncAll';
import asyncAll   from '../src/lib/asyncAll';

export const lab = script();
const { describe, it } = lab;

function asyncTaskFor(val, timeout): Task {
  return (callback) => setTimeout(() => callback(undefined, val), timeout);
}
function asyncErrorFor(val, timeout): Task {
  return (callback) => setTimeout(() => callback(new Error()), timeout);
}

function syncThrow() {
  return () => {
    throw new Error();
  };
}

describe('asyncAll', () => {
  it('resolves with values returned in the order passed in', done => {
    const tasks = [
      asyncTaskFor(1, 100),
      asyncTaskFor(2, 10),
      asyncTaskFor(3, 10)
    ];

    asyncAll(tasks).then(results => {
      expect(results).to.eql([1, 2, 3]);
      done();
    });
  });

  it('rejects with an error if atleast one task fails', done => {
    const tasks = [
      asyncTaskFor(1, 100),
      asyncErrorFor(2, 10),
      asyncErrorFor(3, 10)
    ];

    asyncAll(tasks).catch(error => {
      expect(error instanceof Error).to.be.ok;
      done();
    });
  });

  it('rejects with an error if atleast one task throws sync', done => {
    const tasks = [
      asyncTaskFor(1, 100),
      asyncErrorFor(2, 10),
      syncThrow()
    ];

    asyncAll(tasks).catch(error => {
      expect(error instanceof Error).to.be.ok;
      done();
    });
  });

  it('resolves to an empty array if tasks is also empty', done => {
    const tasks = [];

    asyncAll(tasks).then(results => {
      expect(results).to.eql([]);
      done();
    });
  });
});
