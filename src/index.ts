import containerFactory      from './lib/containerFactory';
import looseContainerFactory from './lib/looseContainerFactory';
import ensureStrictGraph     from './lib/ensureStrictGraph';
import strictGraphToTree     from './lib/strictGraphToTree';
import functionToParams      from './lib/functionToParams';
import * as Types            from './lib/types';

export default looseContainerFactory;

export {
  Types,
  strictGraphToTree,
  ensureStrictGraph,
  functionToParams,
  containerFactory as strictFactory
};
