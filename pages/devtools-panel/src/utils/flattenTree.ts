import type { OutlineNode } from '../types';

export type FlatNode = {
  node: OutlineNode;
  depth: number;
  stageIndex: number;
  hasChildren: boolean;
};

export function flattenTrees(
  trees: OutlineNode[],
  expandedSet: Set<number>,
  visibleIds?: Set<number> | null,
): FlatNode[] {
  const result: FlatNode[] = [];

  function walk(node: OutlineNode, depth: number, stageIndex: number) {
    if (visibleIds && !visibleIds.has(node._id)) return;
    const hasChildren = !!node.children?.length;
    result.push({ node, depth, stageIndex, hasChildren });
    const isExpanded = visibleIds ? visibleIds.has(node._id) : expandedSet.has(node._id);
    if (hasChildren && (expandedSet.has(node._id) || isExpanded)) {
      for (const child of node.children!) {
        walk(child, depth + 1, stageIndex);
      }
    }
  }

  for (let si = 0; si < trees.length; si++) {
    walk(trees[si], 0, si);
  }
  return result;
}

export function collectAllIds(nodes: OutlineNode[]): Set<number> {
  const ids = new Set<number>();
  function walk(n: OutlineNode) {
    ids.add(n._id);
    n.children?.forEach(walk);
  }
  nodes.forEach(walk);
  return ids;
}
