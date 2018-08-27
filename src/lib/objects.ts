export interface StringIndexable {
  [key: string]: any;
}

export function isObject(value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}
