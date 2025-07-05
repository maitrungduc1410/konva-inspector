import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { bridge } from '..';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import type { Filter } from '../types';
import FilterItem from './FilterItem';
import { FILTER_SELECT } from './constants';

export default function Filters() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      getNodeFilters();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getNodeFilters = useCallback(async () => {
    const data = await bridge<Filter[]>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getSelectedNodeFilters()`,
    );
    setFilters(data);
  }, []);

  const renderArrow = useMemo(
    () => (
      <div className="flex text-[var(--color-expand-collapse-toggle)]" onClick={() => setExpanded(v => !v)}>
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    ),
    [expanded],
  );

  const removeFilterItem = useCallback(
    async (index: number) => {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.removeSelectedNodeFilterAtIndex(${index})`,
      );

      // immediately update UI instead waiting for next interval update
      setFilters(filters.filter((item, _index) => _index !== index));
    },
    [filters],
  );

  const addNewFilter = useCallback(async (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value !== '-1') {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.addFilterToSelectedNode('${value}')`,
      );

      e.target.value = '-1';
      e.target.blur();
    }
  }, []);

  return (
    <div className="border-t border-[var(--color-border)] px-1 first:border-t-0">
      <div className="flex items-center">
        {renderArrow}
        <div className="flex flex-1 items-center font-sans" style={{ color: 'var(--color-filter-header)' }}>
          Filters: [{filters.map(item => item.name).join(', ')}]
        </div>
      </div>
      {expanded && (
        <div className="mt-1.5">
          {filters.map((item, index) => (
            <FilterItem key={`${item}-${index}`} {...item} index={index} onRemove={removeFilterItem} />
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[var(--color-border)] px-1 py-1 first:border-t-0">
        <div>
          <div className="mt-2 flex py-0.5 pl-[15px] first:mt-0 hover:rounded hover:bg-[var(--color-background-hover)]">
            <select
              className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
              onChange={addNewFilter}>
              <option value={-1} selected>
                Add new Filter
              </option>
              {FILTER_SELECT.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
