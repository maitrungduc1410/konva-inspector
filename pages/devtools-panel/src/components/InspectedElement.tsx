import { useCallback, useEffect, useMemo, useState } from 'react';
import { bridge } from '..';
import type { OutlineNode } from '../types';
import { NODE_ATTRS, SHAPE_ATTRS, SHAPE_CUSTOM_ATTRS } from './constants';
import Attributes from './Attributes';
import SearchIcon from './icons/SearchIcon';
import Debug from './icons/Debug';
import Filters from './Filters';
import { Tooltip } from 'react-tooltip';
import RenderedBy from './RenderedBy';

interface IProps {
  selectedNode: OutlineNode | null;
  stageIndex: number | null;
  updateActiveNode: () => void;
}

export default function InspectedElement({ selectedNode, stageIndex, updateActiveNode }: IProps) {
  // we create a state to store attrs to provide smooth update when we change attrs
  // otherwise if rely on "selectedNode" interval to update will make it looks laggy
  const [nodeAttrs, setNodeAttrs] = useState<Record<string, string | number | boolean>>({});
  const [attrSearch, setAttrSearch] = useState<string>('');

  useEffect(() => {
    if (selectedNode) {
      setNodeAttrs({
        ...selectedNode.attrs,
      });
    }
  }, [selectedNode]);

  const updateAttr = useCallback(async (attrName: string, val: string | boolean | number) => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.updateAttrs(${JSON.stringify(
        {
          [attrName]: val,
        },
      )})`,
    );
    setNodeAttrs(current => ({
      ...current,
      [attrName]: val,
    }));
  }, []);

  // we don't need to rerender this frequently
  const renderBy = useMemo(
    () => <RenderedBy _id={selectedNode?._id} stageIndex={stageIndex} updateActiveNode={updateActiveNode} />,
    [selectedNode?._id, stageIndex],
  );

  return (
    <>
      <div className="flex h-[42px] flex-wrap items-center border-b border-[var(--color-border)] px-2 text-[15px]">
        {selectedNode && (
          <>
            <div className="flex flex-1 items-center">
              <div
                className="inline-block max-w-full flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-bl-sm rounded-tl-sm bg-[var(--color-component-badge-background)] px-1 pr-0.5 font-mono text-[9px] leading-4 text-[var(--color-text)]"
                style={{ color: 'var(--color-id-key)' }}>
                _id: {selectedNode._id}
              </div>
              <div className="-mr-1 border-[8px] border-l-[8px] border-transparent border-l-[var(--color-component-badge-background)]"></div>
              {selectedNode.className}
            </div>
            <Tooltip id="log-to-console" />
            <button
              className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
              data-tooltip-id="log-to-console"
              data-tooltip-content="Log this element to console"
              onClick={() =>
                bridge(
                  `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.logSelectedToConsole()`,
                )
              }>
              <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
                <Debug />
              </span>
            </button>
          </>
        )}
      </div>
      {selectedNode && (
        <div className="flex h-5 items-center border-b border-[var(--color-border)] px-1 py-1">
          <SearchIcon />
          <input
            className="-ml-4 flex-1 border-none bg-[var(--color-background)] pl-6 text-sm text-[var(--color-text)] outline-none"
            placeholder="Search attributes..."
            value={attrSearch}
            onChange={e => setAttrSearch(e.target.value)}
          />
        </div>
      )}
      <div className="h-[calc(100%-42px-(20px+0.5rem)-3px)] overflow-y-auto">
        {selectedNode && (
          <>
            {SHAPE_CUSTOM_ATTRS[selectedNode.className] && (
              <Attributes
                attrSearch={attrSearch}
                title={`${selectedNode.className} Attributes`}
                attrs={SHAPE_CUSTOM_ATTRS[selectedNode.className]}
                nodeAttrs={nodeAttrs}
                updateAttr={updateAttr}
                keyColor="var(--color-attribute-name)"
              />
            )}

            <Filters />

            {selectedNode.isShape && (
              <Attributes
                attrSearch={attrSearch}
                title="Shape Attributes"
                attrs={SHAPE_ATTRS}
                nodeAttrs={nodeAttrs}
                updateAttr={updateAttr}
              />
            )}

            <Attributes
              attrSearch={attrSearch}
              title="Node Attributes"
              attrs={NODE_ATTRS}
              nodeAttrs={nodeAttrs}
              updateAttr={updateAttr}
            />
            {renderBy}
          </>
        )}
      </div>
    </>
  );
}
