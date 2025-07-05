import { useCallback, useMemo, useState } from 'react';
import { bridge } from '..';
import CopyToClipboard from './icons/CopyToClipboard';
import type { IAttr } from './constants';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import Delete from './icons/Delete';
import { Tooltip } from 'react-tooltip';

interface IProps {
  attrSearch?: string;
  title: string;
  nodeAttrs: Record<string, any>;
  attrs: IAttr[];
  keyColor?: string;
  borderDashed?: boolean;
  showCopyToClipboard?: boolean;
  showDelete?: boolean;
  showExpandIcon?: boolean;
  updateAttr: (attrName: string, val: string | boolean | number) => Promise<void>;
  onRemove?: () => void;
}

export default function Attributes({
  attrSearch,
  title,
  nodeAttrs,
  attrs,
  keyColor,
  borderDashed,
  showCopyToClipboard = true,
  showExpandIcon = true,
  showDelete,
  updateAttr,
  onRemove,
}: IProps) {
  const [expanded, setExpanded] = useState<boolean>(true);

  const copyToClipBoard = useCallback(() => {
    bridge(
      `window.copy(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected().attrs)`,
    );
  }, []);

  const renderArrow = useMemo(
    () => (
      <div
        className={`flex text-[var(--color-expand-collapse-toggle)] ${showExpandIcon ? '' : 'opacity-0'}`}
        onClick={() => setExpanded(v => !v)}>
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    ),
    [expanded, showExpandIcon],
  );

  const filteredAttrs = attrSearch
    ? attrs.filter(item => item.name.toLowerCase().startsWith(attrSearch.toLowerCase()))
    : attrs;

  return (
    <div
      className={`border-t border-[var(--color-border)] px-1 ${borderDashed ? 'border-dashed' : ''} first:border-t-0`}>
      <div className="flex items-center">
        {renderArrow}
        <div className="flex flex-1 items-center font-sans">{title}</div>
        {showCopyToClipboard && (
          <>
            <Tooltip id="copy-attrs-to-clipboard" />
            <button
              className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
              data-tooltip-id="copy-attrs-to-clipboard"
              data-tooltip-content="Copy Attributes to Clipboard"
              onClick={() => copyToClipBoard()}>
              <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
                <CopyToClipboard />
              </span>
            </button>
          </>
        )}
        {showDelete && (
          <button
            className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
            title="Remove entry"
            onClick={() => onRemove && onRemove()}>
            <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
              <Delete />
            </span>
          </button>
        )}
      </div>
      {expanded && (
        <div>
          {filteredAttrs.map(item => {
            let input;

            switch (item.type) {
              case 'boolean': {
                input = (
                  <input
                    className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                    type="checkbox"
                    checked={
                      nodeAttrs[item.name] === undefined
                        ? item.defaultValue !== undefined
                          ? item.defaultValue
                          : true
                        : nodeAttrs[item.name]
                    }
                    onChange={e => updateAttr(item.name, e.target.checked)}
                  />
                );
                break;
              }
              case 'number': {
                input = (
                  <input
                    className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                    value={nodeAttrs[item.name] !== undefined ? nodeAttrs[item.name] : ''}
                    type="number"
                    placeholder="<default>"
                    onChange={e =>
                      updateAttr(
                        item.name,
                        isNaN(e.target.valueAsNumber)
                          ? '' // Use empty string to represent unset value
                          : e.target.valueAsNumber,
                      )
                    }
                    min={item.min}
                    max={item.max}
                    step={item.step || 1}
                  />
                );
                break;
              }
              case 'json': {
                input = (
                  <textarea
                    className="w-full flex-1 resize-y rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                    value={nodeAttrs[item.name] !== undefined ? JSON.stringify(nodeAttrs[item.name]) : ''}
                    placeholder="<default>"
                    onChange={e => updateAttr(item.name, JSON.parse(e.target.value))}
                  />
                );
                break;
              }
              case 'select': {
                input = (
                  <select
                    className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                    onChange={e => updateAttr(item.name, e.target.value)}>
                    {item.options?.map((option, index) => (
                      <option key={`${option.label}-${index}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );
                break;
              }
              default: {
                input = (
                  <input
                    className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                    value={nodeAttrs[item.name] !== undefined ? nodeAttrs[item.name] : ''}
                    type="text"
                    placeholder="<default>"
                    onChange={e => updateAttr(item.name, e.target.value)}
                  />
                );
              }
            }
            return (
              <div
                className="mt-2 flex py-0.5 pl-[15px] first:mt-0 last:mb-1 hover:rounded hover:bg-[var(--color-background-hover)]"
                key={item.name}>
                <span className="mr-2 font-mono" style={{ color: keyColor || 'inherit' }}>
                  {attrSearch?.length ? (
                    <>
                      <mark className="bg-[var(--color-search-match-current)]">
                        {item.name.slice(0, attrSearch.length)}
                      </mark>
                      <span>{item.name.slice(attrSearch.length)}</span>
                    </>
                  ) : (
                    <>{item.name}</>
                  )}
                  :
                </span>
                {input}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
