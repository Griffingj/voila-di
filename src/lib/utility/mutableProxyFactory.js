let mutableTarget;
let targetSet = false;

function setTarget(target) {
  if (!(target instanceof Object)) {
    throw new Error(`Target "${target}" is not an object`);
  }
  mutableTarget = target;
}

export default function mutableProxyFactory() {
  setTarget(() => {});

  // Dynamically forward all the traps to the associated methods on Reflect
  const handler = new Proxy({}, {
    get(target, property) {
      if (!targetSet) {
        throw Error('Placeholder accessed before forwarding configured');
      }
      return (...args) => Reflect[property].apply(null, [mutableTarget, ...args.slice(1)]);
    }
  });

  return {
    set target(target) {
      targetSet = true;
      setTarget(target);
    },
    proxy: new Proxy(mutableTarget, handler)
  };
}
