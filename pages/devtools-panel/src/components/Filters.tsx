import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bridge } from '..';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import Delete from './icons/Delete';
import type { Filter } from '../types';
import FilterItem from './FilterItem';
import { FILTER_SELECT } from './constants';

export default function Filters() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [supportsNative, setSupportsNative] = useState<boolean>(false);
  const [cssFilterInput, setCssFilterInput] = useState<string>('');
  const cssInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bridge<boolean>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.supportsNativeFilters()`,
    )
      .then(result => setSupportsNative(!!result))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      getNodeFilters();
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getNodeFilters = useCallback(async () => {
    try {
      const data = await bridge<Filter[]>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getSelectedNodeFilters()`,
      );
      setFilters(data);
    } catch {
      // can fail during host page reload
    }
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

  const addNativeCssFilter = useCallback(async () => {
    const value = cssFilterInput.trim();
    if (!value) return;

    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && __KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.addNativeFilterToSelectedNode(${JSON.stringify(value)})`,
    );
    setCssFilterInput('');
  }, [cssFilterInput]);

  const handleCssFilterKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        addNativeCssFilter();
      }
    },
    [addNativeCssFilter],
  );

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
          {filters.map((item, index) =>
            item.native ? (
              <div
                key={`native-${index}`}
                className="flex items-center border-t border-dashed border-[var(--color-border)] px-1 py-1 first:border-t-0">
                <span className="flex-1 pl-[15px] font-mono text-[11px]" style={{ color: 'var(--color-filter-key)' }}>
                  {item.name}
                </span>
                <button
                  className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
                  title="Remove entry"
                  onClick={() => removeFilterItem(index)}>
                  <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
                    <Delete />
                  </span>
                </button>
              </div>
            ) : (
              <FilterItem key={`${item.name}-${index}`} {...item} index={index} onRemove={removeFilterItem} />
            ),
          )}
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
          {supportsNative && (
            <div className="mt-1 flex items-center py-0.5 pl-[15px] hover:rounded hover:bg-[var(--color-background-hover)]">
              <input
                ref={cssInputRef}
                className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] placeholder:text-[var(--color-attribute-editable-value)] placeholder:opacity-50 focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                type="text"
                placeholder="CSS filter, e.g. blur(5px)"
                value={cssFilterInput}
                onChange={e => setCssFilterInput(e.target.value)}
                onKeyDown={handleCssFilterKeyDown}
              />
              <button
                className="ml-1 flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
                onClick={addNativeCssFilter}>
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
