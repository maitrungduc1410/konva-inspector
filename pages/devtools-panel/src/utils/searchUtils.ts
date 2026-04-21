import type { OutlineNode } from '../types';

export type SearchQuery =
  | { type: 'none' }
  | { type: 'regex'; pattern: RegExp }
  | { type: 'attr'; attrName: string; attrValue: string }
  | { type: 'id'; id: number }
  | { type: 'text'; text: string };

export function parseSearch(input: string): SearchQuery {
  const trimmed = input.trim();
  if (!trimmed) return { type: 'none' };

  // #123 -> match by _id
  const idMatch = trimmed.match(/^#(\d+)$/);
  if (idMatch) return { type: 'id', id: parseInt(idMatch[1], 10) };

  // /pattern/ or /pattern/i -> regex
  const regexMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);
  if (regexMatch) {
    try {
      return { type: 'regex', pattern: new RegExp(regexMatch[1], regexMatch[2] || 'i') };
    } catch {
      return { type: 'text', text: trimmed };
    }
  }

  // attr:value -> attribute search
  const attrMatch = trimmed.match(/^(\w+):(.+)$/);
  if (attrMatch) {
    return { type: 'attr', attrName: attrMatch[1], attrValue: attrMatch[2] };
  }

  return { type: 'text', text: trimmed };
}

export function matchesNode(query: SearchQuery, node: OutlineNode): boolean {
  switch (query.type) {
    case 'none':
      return true;
    case 'id':
      return node._id === query.id;
    case 'regex':
      return query.pattern.test(node.className) ||
        (node.attrs.name && query.pattern.test(String(node.attrs.name))) ||
        (node.attrs.id && query.pattern.test(String(node.attrs.id)));
    case 'attr': {
      const val = node.attrs[query.attrName];
      if (val === undefined) return false;
      return String(val).toLowerCase().includes(query.attrValue.toLowerCase());
    }
    case 'text': {
      const lower = query.text.toLowerCase();
      return node.className.toLowerCase().includes(lower) ||
        (node.attrs.name && String(node.attrs.name).toLowerCase().includes(lower)) ||
        (node.attrs.id && String(node.attrs.id).toLowerCase().includes(lower)) ||
        String(node._id).includes(query.text);
    }
  }
}

/**
 * Collect IDs of all nodes that match the query, plus their ancestors (so matched
 * nodes are always visible in the tree even if a parent is collapsed).
 */
export function collectMatchIds(trees: OutlineNode[], query: SearchQuery): Set<number> | null {
  if (query.type === 'none') return null;

  const matchIds = new Set<number>();
  const ancestorIds = new Set<number>();

  function walk(node: OutlineNode, ancestors: number[]) {
    const isMatch = matchesNode(query, node);
    if (isMatch) {
      matchIds.add(node._id);
      for (const aid of ancestors) ancestorIds.add(aid);
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child, [...ancestors, node._id]);
      }
    }
  }

  for (const tree of trees) walk(tree, []);

  const combined = new Set<number>();
  for (const id of matchIds) combined.add(id);
  for (const id of ancestorIds) combined.add(id);
  return combined;
}
