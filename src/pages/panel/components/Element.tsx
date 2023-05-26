import { useState } from "react";
import DownArrow from "./DownArrow";
import RightArrow from "./RightArrow";
import { OutlineNode } from "../types";
import { bridge } from "..";

interface IProps {
  searchText: string;
  selectedNode: OutlineNode | null;
  stageIndex: number;
  indent: number;
  node: OutlineNode;
  onSelectNode: (data: OutlineNode) => void;
}

export default function Element({
  searchText,
  selectedNode,
  stageIndex,
  indent,
  node,
  onSelectNode,
}: IProps) {
  const [expanded, setExpanded] = useState<boolean>(true);

  const renderArrow = () => {
    return (
      <div
        className={`expand-collapse-toggle ${
          !node.children?.length ? "hidden" : ""
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <DownArrow /> : <RightArrow />}
      </div>
    );
  };

  const shouldHighlight =
    searchText.length && node.className.startsWith(searchText);
  return (
    <>
      <div
        className={`element ${
          selectedNode?._id === node._id ? "selected" : ""
        }`}
        style={{ paddingLeft: indent * 15 }}
        onClick={async () => {
          const data = await bridge<OutlineNode>(
            `__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${node._id}, ${stageIndex})`
          );

          onSelectNode(data);
        }}
        onMouseEnter={() => {
          bridge(
            `__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.activate(${node._id}, ${stageIndex})`
          );
        }}
      >
        {renderArrow()}
        {shouldHighlight ? (
          <>
            <mark className="current-highlight">
              {node.className.slice(0, searchText.length)}
            </mark>
            <span>{node.className.slice(searchText.length)}</span>
          </>
        ) : (
          <>{node.className}</>
        )}
        &nbsp;<span className="key-name">_id</span>=
        <span className="key-value">{node._id}</span>
      </div>
      {expanded &&
        node.children?.map((item) => (
          <Element
            key={item._id}
            searchText={searchText}
            selectedNode={selectedNode}
            stageIndex={stageIndex}
            indent={indent + 1}
            node={item}
            onSelectNode={onSelectNode}
          />
        ))}
    </>
  );
}
