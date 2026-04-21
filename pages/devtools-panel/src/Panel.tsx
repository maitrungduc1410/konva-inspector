import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Panel.scss';
import Element from './components/Element';
import { bridge } from './';
import type { OutlineNode, SceneStats } from './types';
import InspectedElement from './components/InspectedElement';
import StatsBar from './components/StatsBar';
import Profiler from './components/Profiler';
import AnimationTracker from './components/AnimationTracker';
import ToggleOff from './components/icons/ToggleOff';
import SearchIcon from './components/icons/SearchIcon';
import { useStorage } from '@extension/shared';
import connect from './devtools/connect';
import { exampleThemeStorage } from '@extension/storage';
import Sun from './components/icons/Sun';
import Moon from './components/icons/Moon';
import Export from './components/icons/Export';
import Import from './components/icons/Import';
import HitRegion from './components/icons/HitRegion';
import Heatmap from './components/icons/Heatmap';
import Camera from './components/icons/Camera';
import Transform from './components/icons/Transform';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Tooltip } from 'react-tooltip';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flattenTrees, collectAllIds } from './utils/flattenTree';
import { parseSearch, collectMatchIds } from './utils/searchUtils';
import Pin from './components/icons/Pin';
import Keyboard from './components/icons/Keyboard';

const ROW_HEIGHT = 18;

const Panel: React.FC = () => {
  const [trees, setTrees] = useState<OutlineNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OutlineNode | null>(null);
  const [selectedNodeStageIndex, setSelectedNodeStageIndex] = useState<number | null>(null);
  const [activeNode, setActiveNode] = useState<OutlineNode | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [alwaysInspect, setAlwaysInspect] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<SceneStats | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'profiler' | 'animations'>('elements');
  const [hitRegionsVisible, setHitRegionsVisible] = useState(false);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [gizmoVisible, setGizmoVisible] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const shortcutsMenuRef = useRef<HTMLDivElement>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const isMouseOverTreeViewRef = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const { isLight } = useStorage(exampleThemeStorage);

  const searchQuery = useMemo(() => parseSearch(searchText), [searchText]);
  const searchVisibleIds = useMemo(
    () => collectMatchIds(trees, searchQuery),
    [trees, searchQuery],
  );
  const flatRows = useMemo(
    () => flattenTrees(trees, expandedIds, searchVisibleIds),
    [trees, expandedIds, searchVisibleIds],
  );

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  useEffect(() => {
    chrome.storage.local.get('konva_pinned_ids', result => {
      if (result.konva_pinned_ids) {
        try { setPinnedIds(new Set(JSON.parse(result.konva_pinned_ids))); } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (pinnedIds.size > 0) {
      chrome.storage.local.set({ konva_pinned_ids: JSON.stringify([...pinnedIds]) });
    } else {
      chrome.storage.local.remove('konva_pinned_ids');
    }
  }, [pinnedIds]);

  const togglePin = useCallback((nodeId: number) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const pinnedRows = useMemo(
    () => flatRows.filter(r => pinnedIds.has(r.node._id)),
    [flatRows, pinnedIds],
  );

  useEffect(() => {
    if (!exportMenuOpen && !shortcutsOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
      if (shortcutsOpen && shortcutsMenuRef.current && !shortcutsMenuRef.current.contains(e.target as Node)) {
        setShortcutsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportMenuOpen, shortcutsOpen]);

  // Auto-expand new nodes while preserving user collapse decisions
  useEffect(() => {
    if (trees.length === 0) {
      knownIdsRef.current = new Set();
      setExpandedIds(new Set());
      return;
    }
    const allIds = collectAllIds(trees);
    const prev = knownIdsRef.current;
    if (prev.size === 0) {
      setExpandedIds(new Set(allIds));
    } else {
      let hasNew = false;
      for (const id of allIds) {
        if (!prev.has(id)) {
          hasNew = true;
          break;
        }
      }
      if (hasNew) {
        setExpandedIds(current => {
          const next = new Set(current);
          for (const id of allIds) {
            if (!prev.has(id)) next.add(id);
          }
          return next;
        });
      }
    }
    knownIdsRef.current = allIds;
  }, [trees]);

  const toggleExpand = useCallback((nodeId: number) => {
    setExpandedIds(current => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const getStats = useCallback(async () => {
    try {
      const data = await bridge<SceneStats>(
        'window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.outline.stats()',
      );
      if (data) setStats(data);
    } catch {
      // can fail during host page reload
    }
  }, []);

  useEffect(() => {
    if (hitRegionsVisible) {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.showHitRegions()`,
      ).catch(() => {});
    } else {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.hideHitRegions()`,
      ).catch(() => {});
    }
  }, [hitRegionsVisible]);

  useEffect(() => {
    if (heatmapVisible) {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.showHeatmap()`,
      ).catch(() => {});
    } else {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.hideHeatmap()`,
      ).catch(() => {});
    }
  }, [heatmapVisible]);

  useEffect(() => {
    if (gizmoVisible) {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.showGizmo()`,
      ).catch(() => {});
    } else {
      bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay.hideGizmo()`,
      ).catch(() => {});
    }
  }, [gizmoVisible]);

  // Keyboard shortcuts — capture phase so we intercept before Chrome DevTools defaults
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (activeTab !== 'elements') return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const curIdx = selectedNode ? flatRows.findIndex(r => r.node._id === selectedNode._id) : -1;
        const nextIdx = e.key === 'ArrowDown'
          ? Math.min(curIdx + 1, flatRows.length - 1)
          : Math.max(curIdx - 1, 0);
        if (nextIdx >= 0 && nextIdx < flatRows.length) {
          const row = flatRows[nextIdx];
          bridge<OutlineNode>(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.select(${row.node._id}, ${row.stageIndex}, false)`,
          ).then(data => {
            if (data) {
              setSelectedNode(data);
              setSelectedNodeStageIndex(row.stageIndex);
            }
          }).catch(() => {});
          virtualizer.scrollToIndex(nextIdx, { align: 'auto' });
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedNode && !expandedIds.has(selectedNode._id)) {
          setExpandedIds(s => new Set(s).add(selectedNode._id));
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedNode && expandedIds.has(selectedNode._id)) {
          setExpandedIds(s => { const n = new Set(s); n.delete(selectedNode._id); return n; });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedNode(null);
        setSelectedNodeStageIndex(null);
        bridge('window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deselect()').catch(() => {});
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          e.preventDefault();
          const idx = flatRows.findIndex(r => r.node._id === selectedNode._id);
          const si = idx >= 0 ? flatRows[idx].stageIndex : 0;
          bridge(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && (function() { var s = window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.stage(${si}); var n = s.findOne(function(n){ return n._id === ${selectedNode._id}; }); if(n && n.destroy){ n.destroy(); } return true; })()`,
          ).catch(() => {});
          setSelectedNode(null);
          setSelectedNodeStageIndex(null);
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (selectedNode) {
          const curVisible = selectedNode.attrs.visible !== false;
          bridge(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.updateAttrs(${JSON.stringify({ visible: !curVisible })})`,
          ).catch(() => {});
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (selectedNode) {
          const curListening = selectedNode.attrs.listening !== false;
          bridge(
            `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.updateAttrs(${JSON.stringify({ listening: !curListening })})`,
          ).catch(() => {});
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedNode, flatRows, activeTab, expandedIds, virtualizer]);

  // handle tree
  useEffect(() => {
    getStageTree();

    const interval = setInterval(async () => {
      getStageTree();
      getSelectedNode();
      getStats();
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
      setSelectedNodeStageIndex(null);
      setActiveNode(null);
      setSearchText('');
      setAlwaysInspect(false);
      setStats(null);
      setHitRegionsVisible(false);
      setHeatmapVisible(false);
      setGizmoVisible(false);
      // Delay connect to allow the new page context to initialize
      setTimeout(() => connect(bridge), 500);
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
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.registerMouseOverEvents()`).catch(() => {});

      const interval = setInterval(async () => {
        if (!isMouseOverTreeViewRef.current) {
          getActiveNode();
        }
      }, 500);

      return () => {
        clearInterval(interval);
        bridge(`
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ &&
        window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.unregisterMouseOverEvents()`).catch(() => {});
      };
    }

    return undefined;
  }, [alwaysInspect]);

  useEffect(() => {
    if (activeTab !== 'elements') {
      bridge('window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()').catch(
        () => {},
      );
      isMouseOverTreeViewRef.current = false;
      return;
    }

    const inspectedTree = document.getElementById('inspected-trees') as HTMLDivElement;
    if (!inspectedTree) return;

    function handleMouseLeave() {
      bridge('window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()').catch(
        () => {},
      );
      isMouseOverTreeViewRef.current = false;
    }
    function handleMouseOver() {
      isMouseOverTreeViewRef.current = true;
    }
    inspectedTree.addEventListener('mouseleave', handleMouseLeave);
    inspectedTree.addEventListener('mouseover', handleMouseOver);

    return () => {
      inspectedTree.removeEventListener('mouseleave', handleMouseLeave);
      inspectedTree.removeEventListener('mouseover', handleMouseOver);
    };
  }, [activeTab]);

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
    try {
      const data = await bridge<{ node: OutlineNode; stageIndex: number }>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.selected(true, true)`,
      );
      if (data) {
        setSelectedNode(data.node);
        setSelectedNodeStageIndex(data.stageIndex);
      }
    } catch {
      // can fail during host page reload when execution context is destroyed
    }
  }, []);

  const getActiveNode = useCallback(async () => {
    try {
      const data = await bridge<OutlineNode>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.active(true)`,
      );

      setActiveNode(data);
      if (data && alwaysInspect) {
        const idx = flatRows.findIndex(r => r.node._id === data._id);
        if (idx >= 0) {
          virtualizer.scrollToIndex(idx, { align: 'center' });
        }
      }

      const shouldAlwaysInspect = await bridge<boolean>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getAlwaysInspect()`,
      );

      setAlwaysInspect(shouldAlwaysInspect);
    } catch {
      // can fail during host page reload when execution context is destroyed
    }
  }, [alwaysInspect, flatRows, virtualizer]);

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
        <Tooltip id="hit-regions" />
        <button
          className={`border-none ${
            hitRegionsVisible
              ? 'bg-[var(--color-button-background)] text-[var(--color-button-active)] outline-none'
              : 'bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
          } flex-shrink-0 cursor-pointer rounded p-0`}
          onClick={() => setHitRegionsVisible(cur => !cur)}
          data-tooltip-id="hit-regions"
          data-tooltip-content="Toggle hit region visualization">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <HitRegion />
          </span>
        </button>
        <Tooltip id="heatmap" />
        <button
          className={`border-none ${
            heatmapVisible
              ? 'bg-[var(--color-button-background)] text-[var(--color-button-active)] outline-none'
              : 'bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
          } flex-shrink-0 cursor-pointer rounded p-0`}
          onClick={() => setHeatmapVisible(cur => !cur)}
          data-tooltip-id="heatmap"
          data-tooltip-content="Toggle render heatmap (tracks draw frequency per layer)">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <Heatmap />
          </span>
        </button>
        <Tooltip id="gizmo" />
        <button
          className={`border-none ${
            gizmoVisible
              ? 'bg-[var(--color-button-background)] text-[var(--color-button-active)] outline-none'
              : 'bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
          } flex-shrink-0 cursor-pointer rounded p-0`}
          onClick={() => setGizmoVisible(cur => !cur)}
          data-tooltip-id="gizmo"
          data-tooltip-content="Toggle transform gizmo (resize/rotate/move selected node)">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <Transform />
          </span>
        </button>
        <div className="mx-2 h-5 w-px flex-shrink-0 bg-[var(--color-border)]"></div>
        <div className="flex flex-1 items-center">
          <SearchIcon />
          <input
            ref={searchInputRef}
            className="-ml-4 flex-1 border-none bg-[var(--color-background)] pl-6 text-sm text-[var(--color-text)] outline-none"
            placeholder="Search (text, /regex/, attr:value, #id)"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="mx-2 h-5 w-px flex-shrink-0 bg-[var(--color-border)]"></div>
        <div ref={exportMenuRef} className="relative flex-shrink-0">
          <Tooltip id="export-stage" />
          <button
            className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
            onClick={() => setExportMenuOpen(v => !v)}
            data-tooltip-id="export-stage"
            data-tooltip-content="Export stage as JSON">
            <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
              <Export />
            </span>
          </button>
          {exportMenuOpen && (
            <div className="absolute left-0 top-full z-[9999] mt-1 min-w-[160px] rounded border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
              {trees.length === 0 ? (
                <div className="px-3 py-1.5 font-mono text-[10px] text-[var(--color-text)] opacity-50">
                  No stages found
                </div>
              ) : (
                trees.map((tree, i) => (
                  <button
                    key={tree._id}
                    className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-1.5 text-left font-mono text-[11px] text-[var(--color-text)] hover:bg-[var(--color-button-background-hover,rgba(255,255,255,0.06))]"
                    onClick={async () => {
                      setExportMenuOpen(false);
                      try {
                        const json = await bridge<string>(
                          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.exportStageJSON(${i})`,
                        );
                        if (json) {
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `konva-stage-${i}-export.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      } catch {}
                    }}>
                    <span className="text-[var(--color-component-name)]">{tree.className}</span>
                    <span className="opacity-50">#{tree._id}</span>
                    <span className="ml-auto opacity-40">stage {i}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <Tooltip id="screenshot-stage" />
        <button
          className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
          onClick={async () => {
            try {
              const dataUrl = await bridge<string>(
                `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.screenshotStage(0)`,
              );
              if (dataUrl) {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'konva-stage-screenshot.png';
                a.click();
              }
            } catch {}
          }}
          data-tooltip-id="screenshot-stage"
          data-tooltip-content="Screenshot stage as PNG">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <Camera />
          </span>
        </button>
        <Tooltip id="import-json" />
        <button
          className="flex-shrink-0 cursor-pointer rounded border-none bg-[var(--color-button-background)] p-0 text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
          onClick={() => importInputRef.current?.click()}
          data-tooltip-id="import-json"
          data-tooltip-content="Import JSON into selected container (or first layer)">
          <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
            <Import />
          </span>
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const escaped = JSON.stringify(text);
              await bridge(
                `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.importJSON(${escaped}, 0)`,
              );
            } catch {}
            e.target.value = '';
          }}
        />
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
        <div ref={shortcutsMenuRef} className="relative flex-shrink-0">
          <Tooltip id="keyboard-shortcuts" />
          <button
            className={`border-none ${
              shortcutsOpen
                ? 'bg-[var(--color-button-background)] text-[var(--color-button-active)] outline-none'
                : 'bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
            } flex-shrink-0 cursor-pointer rounded p-0`}
            onClick={() => setShortcutsOpen(v => !v)}
            data-tooltip-id="keyboard-shortcuts"
            data-tooltip-content="Keyboard shortcuts">
            <span className="inline-flex items-center rounded px-1" tabIndex={-1}>
              <Keyboard />
            </span>
          </button>
          {shortcutsOpen && (
            <div className="absolute right-0 top-full z-[9999] mt-1 min-w-[220px] rounded border border-[var(--color-border)] bg-[var(--color-background)] py-2 px-3 shadow-lg">
              <div className="mb-1.5 font-sans text-[11px] font-semibold text-[var(--color-text)]">Keyboard Shortcuts</div>
              <table className="w-full font-mono text-[10px] text-[var(--color-text)]">
                <tbody>
                  {[
                    ['↑ / ↓', 'Navigate tree'],
                    ['→', 'Expand node'],
                    ['←', 'Collapse node'],
                    ['Escape', 'Deselect'],
                    ['Delete', 'Remove node'],
                    ['H', 'Toggle visibility'],
                    ['L', 'Toggle listening'],
                    [`${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+F`, 'Search'],
                  ].map(([key, desc]) => (
                    <tr key={key}>
                      <td className="whitespace-nowrap py-0.5 pr-3 text-[var(--color-component-name)]">{key}</td>
                      <td className="py-0.5 opacity-70">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    ),
    [alwaysInspect, hitRegionsVisible, heatmapVisible, gizmoVisible, isLight, searchText, trees, exportMenuOpen, shortcutsOpen],
  );

  const virtualItems = virtualizer.getVirtualItems();

  const renderTabBar = (
    <div className="flex h-[28px] flex-shrink-0 items-stretch border-b border-[var(--color-border)]">
      <button
        className={`cursor-pointer border-b-2 border-r border-r-[var(--color-border)] px-3 font-sans text-[11px] ${
          activeTab === 'elements'
            ? 'border-b-blue-500 bg-[var(--color-background)] text-[var(--color-text)]'
            : 'border-b-transparent bg-transparent text-[var(--color-text)] opacity-50 hover:opacity-80'
        }`}
        onClick={() => setActiveTab('elements')}>
        Elements
      </button>
      <button
        className={`cursor-pointer border-b-2 border-r border-r-[var(--color-border)] px-3 font-sans text-[11px] ${
          activeTab === 'profiler'
            ? 'border-b-blue-500 bg-[var(--color-background)] text-[var(--color-text)]'
            : 'border-b-transparent bg-transparent text-[var(--color-text)] opacity-50 hover:opacity-80'
        }`}
        onClick={() => setActiveTab('profiler')}>
        Profiler
      </button>
      <button
        className={`cursor-pointer border-b-2 border-r border-r-[var(--color-border)] px-3 font-sans text-[11px] ${
          activeTab === 'animations'
            ? 'border-b-blue-500 bg-[var(--color-background)] text-[var(--color-text)]'
            : 'border-b-transparent bg-transparent text-[var(--color-text)] opacity-50 hover:opacity-80'
        }`}
        onClick={() => setActiveTab('animations')}>
        Animations
      </button>
    </div>
  );

  return (
    <div className={`components ${isLight ? 'light' : 'dark'} relative flex h-full w-full flex-col`}>
      {renderTabBar}
      {activeTab === 'elements' ? (
        <div className="flex-1 overflow-hidden">
          <Allotment>
            <Allotment.Pane preferredSize={'65%'}>
              <div className="flex h-full flex-col overflow-auto border-t border-[var(--color-border)]">
                {renderToolbar}
                <div
                  id="inspected-trees"
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto">
                  {pinnedRows.length > 0 && (
                    <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                      <div className="flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] text-[var(--color-text)] opacity-50">
                        <Pin filled /> Pinned
                      </div>
                      {pinnedRows.map(flatNode => (
                        <Element
                          key={`pin-${flatNode.node._id}`}
                          searchText={searchText}
                          searchQuery={searchQuery}
                          selectedNode={selectedNode}
                          activeNode={activeNode}
                          stageIndex={flatNode.stageIndex}
                          depth={0}
                          node={flatNode.node}
                          hasChildren={flatNode.hasChildren}
                          isExpanded={false}
                          onToggleExpand={toggleExpand}
                          onSelectNode={data => {
                            setSelectedNode(data);
                            setSelectedNodeStageIndex(flatNode.stageIndex);
                            setAlwaysInspect(false);
                            setActiveNode(null);
                          }}
                          isPinned={true}
                          onTogglePin={togglePin}
                        />
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      width: '100%',
                      position: 'relative',
                    }}>
                    {virtualItems.map(virtualRow => {
                      const flatNode = flatRows[virtualRow.index];
                      return (
                        <div
                          key={virtualRow.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: ROW_HEIGHT,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}>
                          <Element
                            searchText={searchText}
                            searchQuery={searchQuery}
                            selectedNode={selectedNode}
                            activeNode={activeNode}
                            stageIndex={flatNode.stageIndex}
                            depth={flatNode.depth}
                            node={flatNode.node}
                            hasChildren={flatNode.hasChildren}
                            isExpanded={expandedIds.has(flatNode.node._id)}
                            onToggleExpand={toggleExpand}
                            onSelectNode={data => {
                              setSelectedNode(data);
                              setSelectedNodeStageIndex(flatNode.stageIndex);
                              setAlwaysInspect(false);
                              setActiveNode(null);
                            }}
                            isPinned={pinnedIds.has(flatNode.node._id)}
                            onTogglePin={togglePin}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <StatsBar stats={stats} />
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
      ) : activeTab === 'profiler' ? (
        <div className="flex-1 overflow-hidden border-t border-[var(--color-border)]">
          <Profiler />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden border-t border-[var(--color-border)]">
          <AnimationTracker />
        </div>
      )}
    </div>
  );
};

export default Panel;
