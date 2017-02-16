export default function flatten(nestedArray: any[]) {
  const flattened: any[] = [];

  for (const item of nestedArray) {
    if (Array.isArray(item)) {
      flattened.push(...item);
    } else {
      flattened.push(item);
    }
  }
  return flattened;
}
