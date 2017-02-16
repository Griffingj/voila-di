const doNothing = () => undefined;

export default function once(doOnce: Function) {
  let action = doOnce;

  return (...args) => {
    action(...args);
    action = doNothing;
  };
}
