import { useEffect, useState } from "react";
import { bridge } from "..";
import { OutlineNode } from "../types";
import { ATTRS, SHAPE_ATTRS, SHAPE_CUSTOM_ATTRS } from "./constants";
import Attributes from "./Attributes";

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
          <>
            {SHAPE_CUSTOM_ATTRS[selectedNode.className] && (
              <Attributes
                title={`${selectedNode.className} Attributes`}
                attrs={SHAPE_CUSTOM_ATTRS[selectedNode.className]}
                nodeAttrs={nodeAttrs}
                updateAttr={updateAttr}
                custom
              />
            )}

            <Attributes
              title="Attributes"
              attrs={attrs}
              nodeAttrs={nodeAttrs}
              updateAttr={updateAttr}
            />
          </>
        )}
      </div>
    </>
  );
}
