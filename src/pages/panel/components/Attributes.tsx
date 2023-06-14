import React from "react";
import { bridge } from "..";
import CopyToClipboard from "./CopyToClipboard";
import { IAttr } from "./constants";

interface IProps {
  title: string;
  nodeAttrs: Record<string, any>;
  attrs: IAttr[];
  custom?: boolean;
  updateAttr: (attrName: string, val: any) => Promise<void>;
}

export default function Attributes({
  title,
  nodeAttrs,
  attrs,
  custom,
  updateAttr,
}: IProps) {
  const copyToClipBoard = () => {
    bridge(
      `window.copy(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected().attrs)`
    );
  };

  return (
    <div className="attributes">
      <div className="header-row">
        <div className="header">{title}</div>
        <button
          className="button"
          title="Copy Attributes to Clipboard"
          onClick={() => copyToClipBoard()}
        >
          <span className="button-content" tabIndex={-1}>
            <CopyToClipboard />
          </span>
        </button>
      </div>
      <div className="attr-list">
        {attrs.map((item) => {
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
              <span className={`item-name ${custom ? "key-name" : ""}`}>
                {item.name}:
              </span>
              {input}
            </div>
          );
        })}
      </div>
    </div>
  );
}
