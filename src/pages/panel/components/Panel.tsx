import React, { useEffect, useRef, useState } from 'react';
import './Panel.scss';
import Element from './Element';
import { bridge } from '..';
import { OutlineNode } from '../types';
import InspectedElement from './InspectedElement';
import ToggleOff from './icons/ToggleOff';
import SearchIcon from './icons/SearchIcon';
import connect from '../devtools/connect';
import logoIcon from '@assets/images/icon128.png';
import Sun from './icons/Sun';
import Moon from './icons/Moon';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Tooltip } from 'react-tooltip';

const Panel: React.FC = () => {
  const [trees, setTrees] = useState<OutlineNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OutlineNode | null>(null);
  const [selectedNodeStageIndex, setSelectedNodeStageIndex] = useState<number | null>(null);
  const [activeNode, setActiveNode] = useState<OutlineNode | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [alwaysInspect, setAlwaysInspect] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const isMouseOverTreeViewRef = useRef<boolean>(false);

  // Handle dark theme
  useEffect(() => {
    chrome.storage.local.get(['isDarkMode']).then(res => {
      if ('isDarkMode' in res) {
        setIsDarkMode(res.isDarkMode);
      } else {
        // default to system theme
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(darkThemeMq.matches);
      }
    });
  }, []);

  // handle tree
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

  // handle host app reload
  useEffect(() => {
    function handleReload() {
      setTrees([]);
      setSelectedNode(null);
      setSearchText('');
      setAlwaysInspect(false);
      connect(bridge);
    }
    // listen on host page reload
    chrome.devtools.network.onNavigated.addListener(handleReload);

    return () => {
      chrome.devtools.network.onNavigated.removeListener(handleReload);
    };
  }, []);

  // handle always inspect
  useEffect(() => {
    if (alwaysInspect) {
      bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.registerMouseOverEvents()`);

      const interval = setInterval(async () => {
        if (!isMouseOverTreeViewRef.current) {
          getActiveNode();
        }
      }, 500);

      return () => {
        clearInterval(interval);
        bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.unregisterMouseOverEvents()`);
      };
    }
  }, [alwaysInspect]);

  useEffect(() => {
    function handleMouseLeave() {
      bridge('window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()');
      isMouseOverTreeViewRef.current = false;
    }
    function handleMouseOver() {
      isMouseOverTreeViewRef.current = true;
    }
    const inspectedTree = document.getElementById('inspected-trees') as HTMLDivElement;
    inspectedTree.addEventListener('mouseleave', handleMouseLeave);
    inspectedTree.addEventListener('mouseover', handleMouseOver);

    return () => {
      inspectedTree.removeEventListener('mouseleave', handleMouseLeave);
      inspectedTree.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  const getStageTree = async () => {
    try {
      const data = await bridge<OutlineNode[]>(
        'window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.outline.trees()',
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
    const data = await bridge<{ node: OutlineNode; stageIndex: number }>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected(true, true)`,
    );
    if (data) {
      setSelectedNode(data.node);
      setSelectedNodeStageIndex(data.stageIndex);
    }
  };

  const getActiveNode = async () => {
    const data = await bridge<OutlineNode>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.active(true)`,
    );

    setActiveNode(data);
    if (data) {
      alwaysInspect &&
        document.getElementById(data._id.toString()).scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'center',
        });
    }

    const shouldAlwaysInspect = await bridge<boolean>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getAlwaysInspect()`,
    );

    setAlwaysInspect(shouldAlwaysInspect);
  };

  const toggleTheme = (isDark: boolean) => {
    chrome.storage.local.set({ isDarkMode: isDark }).then(() => {
      setIsDarkMode(isDark);
    });
  };

  return (
    <div className={`components ${isDarkMode ? 'dark' : 'light'}`}>
      <Allotment>
        <Allotment.Pane preferredSize={'65%'}>
          <div className="tree-list">
            <div className="search-input">
              <a href="https://github.com/maitrungduc1410/konva-inspector" target="_blank" rel="noreferrer">
                <img alt="logo" src={logoIcon} width={28} />
              </a>
              <div className="v-rule"></div>
              <Tooltip id="always-inspect" />
              <button
                className={alwaysInspect ? 'toggle-on' : 'toggle-off'}
                onClick={() => {
                  setAlwaysInspect(cur => !cur);
                }}
                data-tooltip-id="always-inspect"
                data-tooltip-content="Select an object to inspect">
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
                  onChange={e => setSearchText(e.target.value)}
                />
              </div>
              <div className="v-rule"></div>
              <Tooltip id="change-theme" />
              <button
                className="button"
                onClick={() => toggleTheme(!isDarkMode)}
                data-tooltip-id="change-theme"
                data-tooltip-content="Change theme">
                <span className="button-content" tabIndex={-1}>
                  {isDarkMode ? <Sun /> : <Moon />}
                </span>
              </button>
            </div>
            <div id="inspected-trees" className="trees">
              {trees.map((item, index) => (
                <div className="tree-item" key={`tree-item-${index}`}>
                  <Element
                    searchText={searchText}
                    selectedNode={selectedNode}
                    activeNode={activeNode}
                    stageIndex={index}
                    indent={0}
                    node={item}
                    onSelectNode={data => {
                      setSelectedNode(data);
                      setSelectedNodeStageIndex(index);
                      setAlwaysInspect(false);
                      setActiveNode(null); // because next interval may not run yet, so we need to set this to make sure active node is null
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className="inspected-element">
            <InspectedElement
              selectedNode={selectedNode}
              stageIndex={selectedNodeStageIndex}
              updateActiveNode={() => {
                getActiveNode();
              }}
            />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};

export default Panel;
