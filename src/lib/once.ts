export default function once(task: Function) {
  let onlyOnce = task;

  return (...args) => {
    onlyOnce(...args);
    onlyOnce = () => undefined;
  };
}
