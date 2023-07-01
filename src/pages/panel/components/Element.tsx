import { useState } from "react";
import DownArrow from "./icons/DownArrow";
import RightArrow from "./icons/RightArrow";
import { OutlineNode } from "../types";
import { bridge } from "..";

interface IProps {
  searchText: string;
  selectedNode: OutlineNode | null;
  activeNode: OutlineNode | null;
  stageIndex: number;
  indent: number;
  node: OutlineNode;
  onSelectNode: (data: OutlineNode) => void;
}

export default function Element({
  searchText,
  selectedNode,
  activeNode,
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
    searchText.length &&
    node.className.toLowerCase().startsWith(searchText.toLowerCase());
  return (
    <>
      <div
        id={node._id.toString()}
        className={`element ${
          selectedNode?._id === node._id ? "selected" : ""
        } ${activeNode?._id === node._id ? "active" : ""}`}
        style={{ paddingLeft: indent * 15 }}
        onClick={async () => {
          const data = await bridge<OutlineNode>(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${node._id}, ${stageIndex})`
          );

          onSelectNode(data);
        }}
        onMouseEnter={() => {
          bridge(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.activate(${node._id}, ${stageIndex})`
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
        {node.attrs.name && (
          <span title={node.attrs.name}>
            &nbsp;<span className="key-name">name</span>=
            <span className="key-value">&quot;{node.attrs.name}&quot;</span>
          </span>
        )}
        {node.attrs.id && (
          <span title={node.attrs.id}>
            &nbsp;<span className="key-name">id</span>=
            <span className="key-value">&quot;{node.attrs.id}&quot;</span>
          </span>
        )}
      </div>
      {expanded &&
        node.children?.map((item) => (
          <Element
            key={item._id}
            searchText={searchText}
            selectedNode={selectedNode}
            activeNode={activeNode}
            stageIndex={stageIndex}
            indent={indent + 1}
            node={item}
            onSelectNode={onSelectNode}
          />
        ))}
    </>
  );
}
