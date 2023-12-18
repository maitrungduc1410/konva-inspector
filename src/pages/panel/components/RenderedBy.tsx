import { useEffect, useState } from 'react';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import { bridge } from '..';
import { OutlineNode } from '../types';

interface IProps {
  _id: number;
  stageIndex: number | null;
  updateActiveNode: () => void;
}

export default function RenderedBy({ _id, stageIndex, updateActiveNode }: IProps) {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [parents, setParents] = useState<OutlineNode[]>([]);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    if (stageIndex !== null) {
      getVersion();
      getParentStacks();
    }
  }, [_id, stageIndex]);

  const getParentStacks = async () => {
    const data = await bridge<OutlineNode[]>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.renderedBy(${_id}, ${stageIndex})`,
    );
    setParents(data);
  };
  const getVersion = async () => {
    const data = await bridge<string>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().version`,
    );
    setVersion(data);
  };

  const renderArrow = () => {
    return (
      <div className="expand-collapse-toggle" onClick={() => setExpanded(v => !v)}>
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    );
  };

  return (
    <div className="attributes">
      <div className="header-row">
        {renderArrow()}
        <div className="header">Rendered By</div>
      </div>
      {expanded && (
        <div
          className="attr-list"
          style={{ marginTop: 5 }}
          onMouseLeave={async () => {
            await bridge(
              `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()`,
            );
            updateActiveNode(); // immediately update UI for better UX
          }}>
          {parents.map(item => (
            <div
              className="parent-item"
              key={item._id}
              style={{ color: 'var(--color-component-name)' }}
              onMouseEnter={async () => {
                await bridge(
                  `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.activate(${item._id}, ${stageIndex})`,
                );
                updateActiveNode(); // immediately update UI for better UX
              }}
              onClick={() =>
                bridge(
                  `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${item._id}, ${stageIndex})`,
                )
              }>
              <span className="item-name">{item.className}</span>
              &nbsp;<span style={{ color: 'var(--color-id-key)' }}>_id</span>=
              <span className="key-value">{item._id}</span>
            </div>
          ))}
          <div className="parent-item">
            <span className="item-name">Konva@{version}</span>
          </div>
        </div>
      )}
    </div>
  );
}
