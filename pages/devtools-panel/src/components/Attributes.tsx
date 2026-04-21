import { useCallback, useMemo, useRef, useState } from 'react';
import { bridge } from '..';
import CopyToClipboard from './icons/CopyToClipboard';
import type { IAttr } from './constants';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';
import Delete from './icons/Delete';
import { Tooltip } from 'react-tooltip';

const COLOR_ATTR_NAMES = new Set([
  'fill', 'stroke', 'shadowColor', 'borderStroke', 'anchorFill', 'anchorStroke',
]);

function isColorAttr(name: string): boolean {
  return COLOR_ATTR_NAMES.has(name) || name.toLowerCase().endsWith('color');
}

function isValidCSSColor(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^(#[0-9a-f]{3,8}|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|[a-z]+$)/i.test(value.trim());
}

function toHexColor(value: string): string {
  if (!value) return '#000000';
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const el = document.createElement('div');
  el.style.color = value;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = computed.match(/\d+/g);
  if (match && match.length >= 3) {
    const [r, g, b] = match.map(Number);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }
  return '#000000';
}

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
    ).catch(() => {});
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

  const scrubRef = useRef<{
    attrName: string;
    startX: number;
    startVal: number;
    step: number;
  } | null>(null);

  const handleScrubStart = useCallback(
    (e: React.MouseEvent, item: IAttr) => {
      if (item.type !== 'number') return;
      const currentVal = nodeAttrs[item.name];
      if (currentVal === undefined || currentVal === '') return;

      const startX = e.clientX;
      const startVal = Number(currentVal);
      if (isNaN(startVal)) return;

      const step = item.step || 1;
      scrubRef.current = { attrName: item.name, startX, startVal, step };
      document.body.style.cursor = 'ew-resize';

      const handleMove = (me: MouseEvent) => {
        if (!scrubRef.current) return;
        const delta = me.clientX - scrubRef.current.startX;
        let newVal = scrubRef.current.startVal + Math.round(delta / 2) * scrubRef.current.step;
        if (item.min !== undefined) newVal = Math.max(item.min, newVal);
        if (item.max !== undefined) newVal = Math.min(item.max, newVal);
        newVal = Math.round(newVal * 1000) / 1000;
        updateAttr(scrubRef.current.attrName, newVal);
      };

      const handleUp = () => {
        scrubRef.current = null;
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [nodeAttrs, updateAttr],
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
                    onChange={e => {
                      try {
                        updateAttr(item.name, JSON.parse(e.target.value));
                      } catch {
                        // ignore invalid JSON while the user is still typing
                      }
                    }}
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
                const val = nodeAttrs[item.name] !== undefined ? nodeAttrs[item.name] : '';
                const showColorPicker = isColorAttr(item.name) && (val === '' || isValidCSSColor(String(val)));
                input = (
                  <div className="flex flex-1 items-center gap-1">
                    {showColorPicker && (
                      <input
                        type="color"
                        className="h-4 w-4 flex-shrink-0 cursor-pointer rounded-sm border border-[var(--color-border)] p-0"
                        value={val ? toHexColor(String(val)) : '#000000'}
                        onChange={e => updateAttr(item.name, e.target.value)}
                      />
                    )}
                    <input
                      className="w-full flex-1 rounded-sm border border-transparent bg-transparent font-mono text-[11px] text-[var(--color-attribute-editable-value)] focus:bg-[var(--color-button-background-focus)] focus:outline-none"
                      value={val}
                      type="text"
                      placeholder="<default>"
                      onChange={e => updateAttr(item.name, e.target.value)}
                    />
                  </div>
                );
              }
            }
            return (
              <div
                className="mt-2 flex py-0.5 pl-[15px] first:mt-0 last:mb-1 hover:rounded hover:bg-[var(--color-background-hover)]"
                key={item.name}>
                <span
                  className={`mr-2 select-none font-mono ${item.type === 'number' ? 'cursor-ew-resize' : ''}`}
                  style={{ color: keyColor || 'inherit' }}
                  onMouseDown={e => handleScrubStart(e, item)}>
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
