import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Panel.scss';
import Element from './components/Element';
import { bridge } from './';
import type { OutlineNode } from './types';
import InspectedElement from './components/InspectedElement';
import ToggleOff from './components/icons/ToggleOff';
import SearchIcon from './components/icons/SearchIcon';
import { useStorage } from '@extension/shared';
import connect from './devtools/connect';
import { exampleThemeStorage } from '@extension/storage';
import Sun from './components/icons/Sun';
import Moon from './components/icons/Moon';
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
  const isMouseOverTreeViewRef = useRef<boolean>(false);
  const { isLight } = useStorage(exampleThemeStorage);

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

    return undefined;
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

  const getStageTree = useCallback(async () => {
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
  }, []);

  const getSelectedNode = useCallback(async () => {
    const data = await bridge<{ node: OutlineNode; stageIndex: number }>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected(true, true)`,
    );
    if (data) {
      setSelectedNode(data.node);
      setSelectedNodeStageIndex(data.stageIndex);
    }
  }, []);

  const getActiveNode = useCallback(async () => {
    const data = await bridge<OutlineNode>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.active(true)`,
    );

    setActiveNode(data);
    if (data) {
      alwaysInspect &&
        document.getElementById(data._id.toString())?.scrollIntoView({
          behavior: 'auto',
          block: 'center',
          inline: 'center',
        });
    }

    const shouldAlwaysInspect = await bridge<boolean>(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getAlwaysInspect()`,
    );

    setAlwaysInspect(shouldAlwaysInspect);
  }, [alwaysInspect]);

  const renderToolbar = useMemo(
    () => (
      <div className="flex h-[42px] items-center border-b border-[var(--color-border)] px-2">
        <a href="https://github.com/maitrungduc1410/konva-inspector" target="_blank" rel="noreferrer">
          <img alt="logo" src={chrome.runtime.getURL('devtools-panel/icon128.png')} width={28} />
        </a>
        <div className="mx-2 h-5 w-px flex-shrink-0 bg-[var(--color-border)]"></div>
        <Tooltip id="always-inspect" />
        <button
          className={`border-none ${
            alwaysInspect
              ? 'bg-[var(--color-button-background)] text-[var(--color-button-active)] outline-none'
              : 'bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
          } flex-shrink-0 cursor-pointer rounded p-0`}
          onClick={() => {
            setAlwaysInspect(cur => !cur);
          }}
          data-tooltip-id="always-inspect"
          data-tooltip-content="Select an object to inspect">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <ToggleOff />
          </span>
        </button>
        <div className="mx-2 h-5 w-px flex-shrink-0 bg-[var(--color-border)]"></div>
        <div className="flex flex-1 items-center">
          <SearchIcon />
          <input
            className="-ml-4 flex-1 border-none bg-[var(--color-background)] pl-6 text-sm text-[var(--color-text)] outline-none"
            placeholder="Search (text or /regex/)"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="mx-2 h-5 w-px flex-shrink-0 bg-[var(--color-border)]"></div>
        <Tooltip id="change-theme" />
        <button
          className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
          onClick={exampleThemeStorage.toggle}
          data-tooltip-id="change-theme"
          data-tooltip-content="Change theme">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            {isLight ? <Moon /> : <Sun />}
          </span>
        </button>
      </div>
    ),
    [alwaysInspect, isLight, searchText],
  );

  return (
    <div className={`components ${isLight ? 'light' : 'dark'} relative flex h-full w-full flex-row`}>
      <Allotment>
        <Allotment.Pane preferredSize={'65%'}>
          <div className="h-full overflow-auto border-t border-[var(--color-border)]">
            {renderToolbar}
            <div id="inspected-trees" className="h-[calc(100%-42px-3px)] overflow-y-auto">
              {trees.map((item, index) => (
                <div key={`tree-item-${index}`}>
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
          <div className="h-full overflow-auto border-l border-t border-[var(--color-border)]">
            <InspectedElement
              selectedNode={selectedNode}
              stageIndex={selectedNodeStageIndex}
              updateActiveNode={getActiveNode}
            />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};

export default Panel;
