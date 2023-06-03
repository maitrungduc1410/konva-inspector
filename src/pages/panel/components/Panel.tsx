import React, { useEffect, useState } from "react";
import "./Panel.scss";
import Element from "./Element";
import { bridge } from "..";
import { OutlineNode } from "../types";
import InspectedElement from "./InspectedElement";
import ToggleOff from "./ToggleOff";
import SearchIcon from "./SearchIcon";
import connect from "../devtools/connect";
import logoIcon from "@assets/images/icon128.png";
import Sun from "./icons/Sun";
import Moon from "./icons/Moon";

const Panel: React.FC = () => {
  const [trees, setTrees] = useState<OutlineNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OutlineNode | null>(null);
  const [activeNode, setActiveNode] = useState<OutlineNode | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [alwaysInspect, setAlwaysInspect] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.session.get(["isDarkMode"]).then((res) => {
      if ("isDarkMode" in res) {
        setIsDarkMode(res.isDarkMode);
      } else {
        // default to system theme
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDarkMode(darkThemeMq.matches);
      }
    });
  }, []);

  useEffect(() => {
    getStageTree();

    const interval = setInterval(async () => {
      getStageTree();
      getSelectedNode();
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
      // TODO: handle multi stages
      // below we have && 1, to make the evaluation return a number
      // otherwise it'll return a Stage instance and the bridge will fail
      // we also check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].on("mouseover", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selectShapeAtCursor) && 
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].on("click", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.removeHoverToSelectListeners) && 1
      `);

      const interval = setInterval(async () => {
        getActiveNode();
      }, 500);

      return () => {
        clearInterval(interval);

        // TODO: handle multi stages
        // below we need to assign result to a const
        // otherwise it'll return a Stage instance and the bridge will fail
        // we also check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
        bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].off("mouseover", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selectShapeAtCursor) &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva().stages[0].off("click", window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.removeHoverToSelectListeners) && 1
      `);
      };
    }
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

  const getSelectedNode = async () => {
    const data = await bridge<OutlineNode>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected(true)`
    );
    setSelectedNode(data);
  };

  const getActiveNode = async () => {
    const data = await bridge<OutlineNode>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.active(true)`
    );

    setActiveNode(data);
    if (data) {
      alwaysInspect &&
        document.getElementById(data._id.toString()).scrollIntoView();
    } else {
      setAlwaysInspect(false);
    }
  };

  const toggleTheme = (isDark: boolean) => {
    chrome.storage.session.set({ isDarkMode: isDark }).then(() => {
      setIsDarkMode(isDark);
    });
  };

  return (
    <div className={`components ${isDarkMode ? "dark" : "light"}`}>
      <div className="tree-list">
        <div className="search-input">
          <a
            href="https://github.com/maitrungduc1410/konva-inspector"
            target="_blank"
            rel="noreferrer"
          >
            <img src={logoIcon} width={28} />
          </a>
          <div className="v-rule"></div>
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
          <div className="v-rule"></div>
          <button className="button" onClick={() => toggleTheme(!isDarkMode)}>
            <span className="button-content" tabIndex={-1}>
              {isDarkMode ? <Sun /> : <Moon />}
            </span>
          </button>
        </div>
        {trees.map((item, index) => (
          <div className="tree" key={`tree-${index}`}>
            <Element
              searchText={searchText}
              selectedNode={selectedNode}
              activeNode={activeNode}
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
