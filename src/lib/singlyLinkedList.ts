export type SinglyLinkedListNode<T> = {
  next: SinglyLinkedListNode<T> | null;
  value: T;
};

export type SinglyLinkedList<T> = {
  peek(): T | null;
  add(value: T): SinglyLinkedList<T>;
  remove(): T | null;
  size(): number;
}

export default function makeSinglyLinkedList<T>(initialValues?: T[]) {
  let head: SinglyLinkedListNode<T> | null = null;
  let size: number = 0;

  const singlyLinkedList: SinglyLinkedList<T> = {
    peek: () => head && head.value,
    add(value) {
      size++;
      head = { next: head, value };
      return singlyLinkedList;
    },
    remove() {
      // If there are no items in the list
      if (head === null) {
        return null;
      }
      size--;
      const { value } = head;

      // If there is exactly one item in the list
      if (size === 0) {
        head = null;
      } else {
        head = head.next;
      }
      return value;
    },
    size: () => size
  };

  if (initialValues) {
    let i = initialValues.length;

    while (i--) {
      singlyLinkedList.add(initialValues[i]);
    }
  }
  return singlyLinkedList;
}
