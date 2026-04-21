import { useCallback, useMemo, useState } from 'react';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import type { OutlineNode } from '../types';
import { bridge } from '..';
import type { SearchQuery } from '../utils/searchUtils';
import { matchesNode } from '../utils/searchUtils';
import Pin from './icons/Pin';

type DropPosition = 'before' | 'inside' | 'after' | null;

interface IProps {
  searchText: string;
  searchQuery: SearchQuery;
  selectedNode: OutlineNode | null;
  activeNode: OutlineNode | null;
  stageIndex: number;
  depth: number;
  node: OutlineNode;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: (nodeId: number) => void;
  onSelectNode: (data: OutlineNode) => void;
  isPinned?: boolean;
  onTogglePin?: (nodeId: number) => void;
}

export default function Element({
  searchText,
  searchQuery,
  selectedNode,
  activeNode,
  stageIndex,
  depth,
  node,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onSelectNode,
  isPinned,
  onTogglePin,
}: IProps) {
  const [dropPos, setDropPos] = useState<DropPosition>(null);

  const renderArrow = useMemo(
    () => (
      <div
        className={`flex text-[var(--color-expand-collapse-toggle)] ${!hasChildren ? 'opacity-0' : ''}`}
        onClick={e => {
          e.stopPropagation();
          onToggleExpand(node._id);
        }}>
        {isExpanded ? <DownArrow /> : <RightArrow />}
      </div>
    ),
    [hasChildren, isExpanded, node._id, onToggleExpand],
  );

  const isDirectMatch = searchQuery.type !== 'none' && matchesNode(searchQuery, node);

  const select = useCallback(
    async (scrollToElement = false) => {
      try {
        const data = await bridge<OutlineNode>(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${node._id}, ${stageIndex}, ${scrollToElement})`,
        );

        onSelectNode(data);
      } catch {
        // can fail during host page reload
      }
    },
    [node._id, stageIndex, onSelectNode],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('application/konva-node', JSON.stringify({ nodeId: node._id, stageIndex }));
      e.dataTransfer.effectAllowed = 'move';
    },
    [node._id, stageIndex],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('application/konva-node')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const third = rect.height / 3;

      if (y < third) {
        setDropPos('before');
      } else if (y > third * 2 || !hasChildren) {
        setDropPos(hasChildren ? 'inside' : 'after');
      } else {
        setDropPos('inside');
      }
    },
    [hasChildren],
  );

  const handleDragLeave = useCallback(() => {
    setDropPos(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDropPos(null);

      const raw = e.dataTransfer.getData('application/konva-node');
      if (!raw) return;

      try {
        const { nodeId: draggedId, stageIndex: draggedStage } = JSON.parse(raw);
        if (draggedId === node._id) return;

        const pos = (() => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const y = e.clientY - rect.top;
          const third = rect.height / 3;
          if (y < third) return 'before';
          if (y > third * 2 || !hasChildren) return hasChildren ? 'inside' : 'after';
          return 'inside';
        })();

        await bridge(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.moveNode(${draggedId}, ${node._id}, ${JSON.stringify(pos)}, ${draggedStage})`,
        );
      } catch {
        // can fail during reload
      }
    },
    [node._id, hasChildren],
  );

  const dropIndicatorClass =
    dropPos === 'before'
      ? 'border-t-2 border-t-blue-500'
      : dropPos === 'after'
        ? 'border-b-2 border-b-blue-500'
        : dropPos === 'inside'
          ? 'ring-1 ring-inset ring-blue-500/50'
          : '';

  return (
    <div
      className={`group/row flex cursor-pointer items-center font-mono text-[11px] leading-[var(--line-height-data)] text-[var(--color-component-name)] hover:bg-[var(--color-background-hover)] ${
        selectedNode?._id === node._id
          ? '!bg-[var(--color-background-selected)] text-[var(--color-text-selected)] [--color-attribute-name:var(--color-attribute-name-inverted)] [--color-attribute-value:var(--color-attribute-value-inverted)] [--color-component-badge-background:var(--color-component-badge-background-inverted)] [--color-component-badge-count:var(--color-component-badge-count-inverted)] [--color-component-name:var(--color-component-name-inverted)] [--color-expand-collapse-toggle:var(--color-component-name-inverted)] [--color-text:var(--color-text-selected)]'
          : ''
      } ${activeNode?._id === node._id ? 'bg-[var(--color-background-hover)]' : ''} ${dropIndicatorClass}`}
      style={{ paddingLeft: depth * 15 }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => select()}
      onDoubleClick={() => select(true)}
      onMouseEnter={() => {
        bridge(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.activate(${node._id}, ${stageIndex})`,
        ).catch(() => {});
      }}
      title="Double click to scroll to element. Drag to reorder.">
      {renderArrow}
      {isDirectMatch ? (
        <mark className="bg-[var(--color-search-match-current)]">{node.className}</mark>
      ) : (
        <>{node.className}</>
      )}
      &nbsp;<span style={{ color: 'var(--color-id-key)' }}>_id</span>=
      <span className="max-w-1/2 select-text overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-attribute-value)]">
        {node._id}
      </span>
      {node.attrs.name && (
        <span title={node.attrs.name}>
          &nbsp;<span className="text-[var(--color-attribute-name)]">name</span>=
          <span className="max-w-1/2 select-text overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-attribute-value)]">
            &quot;{node.attrs.name}&quot;
          </span>
        </span>
      )}
      {node.attrs.id && (
        <span title={node.attrs.id}>
          &nbsp;<span className="text-[var(--color-attribute-name)]">id</span>=
          <span className="max-w-1/2 select-text overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-attribute-value)]">
            &quot;{node.attrs.id}&quot;
          </span>
        </span>
      )}
      {onTogglePin && (
        <span
          className={`ml-auto flex-shrink-0 cursor-pointer px-0.5 ${isPinned ? 'text-yellow-500' : 'text-[var(--color-text)] opacity-0 group-hover/row:opacity-30 hover:!opacity-70'}`}
          title={isPinned ? 'Unpin node' : 'Pin node for quick access'}
          onClick={e => { e.stopPropagation(); onTogglePin(node._id); }}>
          <Pin filled={isPinned} />
        </span>
      )}
    </div>
  );
}
