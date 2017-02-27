import { StrictGraph } from '../index';
import { TreeNode }    from '../index';

export default function strictGraphToTree(graph: StrictGraph): TreeNode {
  const lookup: Map<string, string[]> = new Map();
  const keys = Object.keys(graph);

  for (const key of keys) {
    const declaration = graph[key];
    lookup.set(key, declaration.dependencies || []);
  }

  function treeify(name: string): TreeNode {
    return {
      name,
      children: (lookup.get(name) || []).map(treeify)
    };
  }

  const children = keys.reduce((acc: TreeNode[], next) => {
    return [treeify(next), ...acc];
  }, []);

  return {
    name: 'container',
    children
  };
}
