import { useState } from "react";
import { bridge } from "..";
import CopyToClipboard from "./icons/CopyToClipboard";
import { IAttr } from "./constants";
import DownArrow from "./icons/DownArrow";
import RightArrow from "./icons/RightArrow";
import Delete from "./icons/Delete";

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
  updateAttr: (attrName: string, val: any) => Promise<void>;
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

  const copyToClipBoard = () => {
    bridge(
      `window.copy(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected().attrs)`
    );
  };

  const renderArrow = () => {
    return (
      <div
        className={`expand-collapse-toggle ${showExpandIcon ? "" : "hidden"}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    );
  };

  const filteredAttrs = attrSearch
    ? attrs.filter((item) =>
        item.name.toLowerCase().startsWith(attrSearch.toLowerCase())
      )
    : attrs;

  return (
    <div className={`attributes ${borderDashed ? "dashed" : ""}`}>
      <div className="header-row">
        {renderArrow()}
        <div className="header">{title}</div>
        {showCopyToClipboard && (
          <button
            className="button"
            title="Copy Attributes to Clipboard"
            onClick={() => copyToClipBoard()}
          >
            <span className="button-content" tabIndex={-1}>
              <CopyToClipboard />
            </span>
          </button>
        )}
        {showDelete && (
          <button
            className="button"
            title="Remove entry"
            onClick={() => onRemove && onRemove()}
          >
            <span className="button-content" tabIndex={-1}>
              <Delete />
            </span>
          </button>
        )}
      </div>
      {expanded && (
        <div className="attr-list">
          {filteredAttrs.map((item) => {
            let input;

            switch (item.type) {
              case "boolean": {
                input = (
                  <input
                    type="checkbox"
                    checked={
                      nodeAttrs[item.name] === undefined
                        ? item.defaultValue !== undefined
                          ? item.defaultValue
                          : true
                        : nodeAttrs[item.name]
                    }
                    onChange={(e) => updateAttr(item.name, e.target.checked)}
                  />
                );
                break;
              }
              case "number": {
                input = (
                  <input
                    value={
                      nodeAttrs[item.name] !== undefined
                        ? nodeAttrs[item.name]
                        : ""
                    }
                    type="number"
                    placeholder="<default>"
                    onChange={(e) =>
                      updateAttr(
                        item.name,
                        isNaN(e.target.valueAsNumber)
                          ? null // JSON.stringify will not preserve undefined, so we have to use null here
                          : e.target.valueAsNumber
                      )
                    }
                    min={item.min}
                    max={item.max}
                    step={item.step || 1}
                  />
                );
                break;
              }
              case "json": {
                input = (
                  <textarea
                    value={
                      nodeAttrs[item.name] !== undefined
                        ? JSON.stringify(nodeAttrs[item.name])
                        : ""
                    }
                    placeholder="<default>"
                    onChange={(e) =>
                      updateAttr(item.name, JSON.parse(e.target.value))
                    }
                  />
                );
                break;
              }
              case "select": {
                input = (
                  <select
                    onChange={(e) => updateAttr(item.name, e.target.value)}
                  >
                    {item.options.map((option, index) => (
                      <option
                        key={`${option.label}-${index}`}
                        value={option.value}
                      >
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
                    value={
                      nodeAttrs[item.name] !== undefined
                        ? nodeAttrs[item.name]
                        : ""
                    }
                    type="text"
                    placeholder="<default>"
                    onChange={(e) => updateAttr(item.name, e.target.value)}
                  />
                );
              }
            }
            return (
              <div className="attr-item" key={item.name}>
                <span
                  className="item-name"
                  style={{ color: keyColor || "inherit" }}
                >
                  {attrSearch?.length ? (
                    <>
                      <mark className="current-highlight">
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
