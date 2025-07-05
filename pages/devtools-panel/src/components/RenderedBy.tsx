import { useCallback, useEffect, useMemo, useState } from 'react';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import { bridge } from '..';
import type { OutlineNode } from '../types';

interface IProps {
  _id?: number;
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

  const getParentStacks = useCallback(async () => {
    const data = await bridge<OutlineNode[]>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.renderedBy(${_id}, ${stageIndex})`,
    );
    setParents(data);
  }, [_id, stageIndex]);

  const getVersion = useCallback(async () => {
    const data = await bridge<string>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().version`,
    );
    setVersion(data);
  }, []);

  const renderArrow = useMemo(
    () => (
      <div className="flex text-[var(--color-expand-collapse-toggle)]" onClick={() => setExpanded(v => !v)}>
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    ),
    [expanded],
  );

  return (
    <div className="border-t border-[var(--color-border)] px-1 first:border-t-0">
      <div className="flex items-center">
        {renderArrow}
        <div className="flex flex-1 items-center font-sans">Rendered By</div>
      </div>
      {expanded && (
        <div
          className="mt-1.25"
          onMouseLeave={async () => {
            await bridge(
              `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()`,
            );
            updateActiveNode(); // immediately update UI for better UX
          }}>
          {parents.map(item => (
            <div
              className="py-0.75 mt-1 flex cursor-pointer pl-[15px] hover:rounded hover:bg-[var(--color-background-hover)]"
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
              <span className="font-mono">{item.className}</span>
              &nbsp;<span style={{ color: 'var(--color-id-key)' }}>_id</span>=
              <span className="max-w-1/2 select-text overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-attribute-value)]">
                {item._id}
              </span>
            </div>
          ))}
          <div className="py-0.75 mt-1 flex cursor-pointer pl-[15px] hover:rounded hover:bg-[var(--color-background-hover)]">
            <span className="font-mono">Konva@{version}</span>
          </div>
        </div>
      )}
    </div>
  );
}
