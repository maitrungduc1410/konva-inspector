import React, { useEffect, useState } from "react";
import "./Panel.scss";
import Element from "./Element";
import { bridge } from "..";
import { OutlineNode } from "../types";
import InspectedElement from "./InspectedElement";
import ToggleOff from "./ToggleOff";
import SearchIcon from "./SearchIcon";
import connect from "../devtools/connect";

const Panel: React.FC = () => {
  const [trees, setTrees] = useState<OutlineNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OutlineNode | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [alwaysInspect, setAlwaysInspect] = useState<boolean>(false);

  useEffect(() => {
    getStageTree();

    const interval = setInterval(async () => {
      getStageTree();

      const data = await bridge<OutlineNode>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected(true)`
      );
      setSelectedNode(data);
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleReload() {
      setTrees([]);
      setSelectedNode(null);
      setSearchText("");
      setAlwaysInspect(false);
      connect(bridge);
    }
    // listen on host page reload
    chrome.devtools.network.onNavigated.addListener(handleReload);

    return () => {
      chrome.devtools.network.onNavigated.removeListener(handleReload);
    };
  }, []);

  useEffect(() => {
    if (alwaysInspect) {
      // below we have && 1, to make the evaluation return a number
      // otherwise it'll return a Stage instance and the bridge will fail
      // we also check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].addEventListener("mouseover", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selectShapeAtCursor) && 1
      `);
    }

    return () => {
      // below we need to assign result to a const
      // otherwise it'll return a Stage instance and the bridge will fail
      // we also check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].removeEventListener("mouseover", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selectShapeAtCursor) && 1
      `);
    };
  }, [alwaysInspect]);

  const getStageTree = async () => {
    try {
      const data = await bridge<OutlineNode[]>(
        "window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.outline.trees()"
      );
      if (data) {
        setTrees(data);
      } else {
        // in case __KONVA_DEVTOOLS_GLOBAL_HOOK__ is undefined
        // can happen during host page reload
        setTrees([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="components">
      <div className="tree-list">
        <div className="search-input">
          <button
            className={alwaysInspect ? "toggle-on" : "toggle-off"}
            onClick={() => setAlwaysInspect((cur) => !cur)}
          >
            <span className="toggle-content" tabIndex={-1}>
              <ToggleOff />
            </span>
          </button>
          <div className="v-rule"></div>
          <div className="search-input-item">
            <SearchIcon />
            <input
              className="input"
              placeholder="Search (text or /regex/)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
        {trees.map((item, index) => (
          <div className="tree" key={`tree-${index}`}>
            <Element
              searchText={searchText}
              selectedNode={selectedNode}
              stageIndex={index}
              indent={0}
              node={item}
              onSelectNode={(data) => setSelectedNode(data)}
            />
          </div>
        ))}
      </div>
      <div className="inspected-element">
        <InspectedElement selectedNode={selectedNode} />
      </div>
    </div>
  );
};

export default Panel;
