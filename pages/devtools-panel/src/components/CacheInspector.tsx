import { useCallback, useEffect, useState } from 'react';
import { bridge } from '..';
import type { CacheInfo } from '../types';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CacheInspector() {
  const [expanded, setExpanded] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

  const fetchCache = useCallback(async () => {
    try {
      const data = await bridge<CacheInfo>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getSelectedNodeCacheInfo()`,
      );
      setCacheInfo(data);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    fetchCache();
    const interval = setInterval(fetchCache, 500);
    return () => clearInterval(interval);
  }, [fetchCache]);

  if (!cacheInfo) return null;

  const toggleCache = async () => {
    if (cacheInfo.isCached) {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.clearSelectedNodeCache()`,
      ).catch(() => {});
    } else {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.cacheSelectedNode()`,
      ).catch(() => {});
    }
    fetchCache();
  };

  return (
    <div className="border-t border-[var(--color-border)] px-1">
      <div className="flex items-center">
        <div
          className="flex text-[var(--color-expand-collapse-toggle)]"
          onClick={() => setExpanded(v => !v)}>
          {expanded ? <DownArrow /> : <RightArrow />}
        </div>
        <div className="flex flex-1 items-center font-sans">
          Cache
          {cacheInfo.isCached && (
            <span className="ml-1 rounded bg-blue-500/20 px-1 font-mono text-[9px] text-blue-400">cached</span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="pb-1 pl-[15px]">
          {cacheInfo.isCached ? (
            <div className="space-y-0.5">
              <div className="flex py-0.5 font-mono text-[11px]">
                <span className="mr-2 text-[var(--color-attribute-name)]">dimensions:</span>
                <span className="text-[var(--color-attribute-editable-value)]">
                  {cacheInfo.width} x {cacheInfo.height}
                </span>
              </div>
              <div className="flex py-0.5 font-mono text-[11px]">
                <span className="mr-2 text-[var(--color-attribute-name)]">memory:</span>
                <span className="text-[var(--color-attribute-editable-value)]">{formatBytes(cacheInfo.memory)}</span>
              </div>
              {cacheInfo.memory > 4 * 1024 * 1024 && (
                <div className="font-mono text-[10px] text-amber-500">
                  &#9888; Large cache ({formatBytes(cacheInfo.memory)})
                </div>
              )}
              <button
                className="mt-1 cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-button-background)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
                onClick={toggleCache}>
                Clear Cache
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-mono text-[10px] opacity-50">Not cached</div>
              <button
                className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-button-background)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
                onClick={toggleCache}>
                Enable Cache
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
