import { useCallback, useMemo, useState } from 'react';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import type { OutlineNode } from '../types';
import { bridge } from '..';

interface IProps {
  searchText: string;
  selectedNode: OutlineNode | null;
  activeNode: OutlineNode | null;
  stageIndex: number;
  indent: number;
  node: OutlineNode;
  onSelectNode: (data: OutlineNode) => void;
}

export default function Element({
  searchText,
  selectedNode,
  activeNode,
  stageIndex,
  indent,
  node,
  onSelectNode,
}: IProps) {
  const [expanded, setExpanded] = useState<boolean>(true);

  const renderArrow = useMemo(
    () => (
      <div
        className={`flex text-[var(--color-expand-collapse-toggle)] ${!node.children?.length ? 'opacity-0' : ''}`}
        onClick={() => setExpanded(v => !v)}>
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    ),
    [node.children?.length, expanded],
  );

  const shouldHighlight = searchText.length && node.className.toLowerCase().startsWith(searchText.toLowerCase());

  const select = useCallback(
    async (scrollToElement = false) => {
      const data = await bridge<OutlineNode>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${node._id}, ${stageIndex}, ${scrollToElement})`,
      );

      onSelectNode(data);
    },
    [node._id, stageIndex, onSelectNode],
  );
  return (
    <>
      <div
        id={node._id.toString()}
        className={`flex cursor-pointer items-center font-mono text-[11px] leading-[var(--line-height-data)] text-[var(--color-component-name)] hover:bg-[var(--color-background-hover)] ${
          selectedNode?._id === node._id
            ? '!bg-[var(--color-background-selected)] text-[var(--color-text-selected)] [--color-attribute-name:var(--color-attribute-name-inverted)] [--color-attribute-value:var(--color-attribute-value-inverted)] [--color-component-badge-background:var(--color-component-badge-background-inverted)] [--color-component-badge-count:var(--color-component-badge-count-inverted)] [--color-component-name:var(--color-component-name-inverted)] [--color-expand-collapse-toggle:var(--color-component-name-inverted)] [--color-text:var(--color-text-selected)]'
            : ''
        } ${activeNode?._id === node._id ? 'bg-[var(--color-background-hover)]' : ''}`}
        style={{ paddingLeft: indent * 15 }}
        onClick={() => select()}
        onDoubleClick={() => select(true)}
        onMouseEnter={() => {
          bridge(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.activate(${node._id}, ${stageIndex})`,
          );
        }}
        title="Double click to scroll to element">
        {renderArrow}
        {shouldHighlight ? (
          <>
            <mark className="bg-[var(--color-search-match-current)]">{node.className.slice(0, searchText.length)}</mark>
            <span>{node.className.slice(searchText.length)}</span>
          </>
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
      </div>
      {expanded &&
        node.children?.map(item => (
          <Element
            key={item._id}
            searchText={searchText}
            selectedNode={selectedNode}
            activeNode={activeNode}
            stageIndex={stageIndex}
            indent={indent + 1}
            node={item}
            onSelectNode={onSelectNode}
          />
        ))}
    </>
  );
}
