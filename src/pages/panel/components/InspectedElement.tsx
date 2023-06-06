import { useEffect, useState } from "react";
import { bridge } from "..";
import { OutlineNode } from "../types";
import CopyToClipboard from "./CopyToClipboard";
import { ATTRS, SHAPE_ATTRS } from "./constants";

interface IProps {
  selectedNode: OutlineNode | null;
}

export default function InspectedElement({ selectedNode }: IProps) {
  // we create a state to store attrs to provide smooth update when we change attrs
  // otherwise if rely on "selectedNode" interval to update will make it looks laggy
  const [nodeAttrs, setNodeAttrs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setNodeAttrs({
        ...selectedNode.attrs,
      });
    }
  }, [selectedNode]);
  // if (!selectedNode) {
  //   return null;
  // }

  const updateAttr = async (attrName: string, val: any) => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.updateAttrs(${JSON.stringify(
        {
          [attrName]: val,
        }
      )})`
    );
    setNodeAttrs((current) => ({
      ...current,
      [attrName]: val,
    }));
  };

  const attrs = selectedNode?.isShape ? SHAPE_ATTRS : ATTRS;

  const copyToClipBoard = () => {
    bridge(
      `window.copy(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected().attrs)`
    );
  };

  return (
    <>
      <div className="title-row">
        {selectedNode && (
          <>
            <div className="key">_id: {selectedNode._id}</div>
            <div className="key-arrow"></div>
            {selectedNode.className}
          </>
        )}
      </div>
      <div className="inspected-element-data">
        {selectedNode && (
          <div className="attributes">
            <div className="header-row">
              <div className="header">Attributes</div>
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
                        onChange={(e) =>
                          updateAttr(item.name, e.target.checked)
                        }
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
                    <span className="item-name">{item.name}:</span>
                    {input}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
