import { script } from 'lab';
import { expect } from 'chai';
import makeSinglyLinkedList from '../src/lib/singlyLinkedList';

export const lab = script() as any;
const { describe, it } = lab;

describe('singlyLinkedList', () => {
  describe('#peek', () => {
    it('returns the value at the start of the sll', done => {
      const sll = makeSinglyLinkedList([1, 2, 3, 4, 5]);
      expect(sll.peek()).to.eql(1);
      done();
    });
  });

  describe('#add', () => {
    it('includes values at the start of the sll', done => {
      const sll1 = makeSinglyLinkedList([1, 2, 3, 4, 5]).add(0);
      expect(sll1.peek()).to.eql(0);
      done();
    });
  });

  describe('#remove', () => {
    it('removes items from the start of the list', done => {
      const sll = makeSinglyLinkedList([1, 2, 3, 4, 5]);
      sll.remove();
      expect(sll.peek()).to.eql(2);
      done();
    });
  });

  describe('#size', () => {
    it('returns the size of singly linked list', done => {
      const sll = makeSinglyLinkedList([1, 2, 3, 4, 5]);
      expect(sll.size()).to.eql(5);
      done();
    });

    it('returns the size after mutations', done => {
      const sll1 = makeSinglyLinkedList([1, 2, 3, 4, 5])
        .add(6)
        .add(7);

      expect(sll1.size()).to.eql(7);

      const sll2 = makeSinglyLinkedList([1, 2, 3, 4, 5])
        .add(0)
        .add(-1)
        .add(6)
        .add(7);

      sll2.remove();
      expect(sll2.size()).to.eql(8);
      done();
    });
  });
});