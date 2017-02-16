import containerFactory from './lib/containerFactory';
import looseContainerFactory from './lib/looseContainerFactory';
import fsGraphFactory from './lib/fsGraphFactory';

export default looseContainerFactory;
export {
  fsGraphFactory,
  containerFactory as strictFactory
};
