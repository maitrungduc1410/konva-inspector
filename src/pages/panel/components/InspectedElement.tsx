import { useEffect, useMemo, useState } from 'react';
import { bridge } from '..';
import { OutlineNode } from '../types';
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
  const [nodeAttrs, setNodeAttrs] = useState<Record<string, string | number>>({});
  const [attrSearch, setAttrSearch] = useState<string>('');

  useEffect(() => {
    if (selectedNode) {
      setNodeAttrs({
        ...selectedNode.attrs,
      });
    }
  }, [selectedNode]);

  const updateAttr = async (attrName: string, val: string | number) => {
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
  };

  // we don't need to rerender this frequently
  const renderBy = useMemo(
    () => <RenderedBy _id={selectedNode?._id} stageIndex={stageIndex} updateActiveNode={updateActiveNode} />,
    [selectedNode?._id, stageIndex],
  );

  return (
    <>
      <div className="title-row">
        {selectedNode && (
          <>
            <div className="selected-element-name">
              <div className="key" style={{ color: 'var(--color-id-key)' }}>
                _id: {selectedNode._id}
              </div>
              <div className="key-arrow"></div>
              {selectedNode.className}
            </div>
            <Tooltip id="log-to-console" />
            <button
              className="button"
              data-tooltip-id="log-to-console"
              data-tooltip-content="Log this element to console"
              onClick={() =>
                bridge(
                  `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.logSelectedToConsole()`,
                )
              }>
              <span className="button-content" tabIndex={-1}>
                <Debug />
              </span>
            </button>
          </>
        )}
      </div>
      {selectedNode && (
        <div className="search-input-item">
          <SearchIcon />
          <input
            className="input"
            placeholder="Search attributes..."
            value={attrSearch}
            onChange={e => setAttrSearch(e.target.value)}
          />
        </div>
      )}
      <div className="inspected-element-data">
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
