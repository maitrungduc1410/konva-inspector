import { useCallback, useEffect, useRef, useState } from 'react';
import { bridge } from '..';
import type { AttrDiff } from '../types';

interface DiffResult {
  nodeId: number;
  diffs: AttrDiff[];
}

export default function NodeDiff() {
  const [expanded, setExpanded] = useState(true);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDiff = useCallback(async () => {
    try {
      const [snap, d] = await Promise.all([
        bridge<boolean>(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.hasSnapshot()`,
        ),
        bridge<DiffResult | null>(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getAttrDiff()`,
        ),
      ]);
      setHasSnapshot(!!snap);
      if (d) setDiff(d);
      else setDiff(null);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    fetchDiff();
    pollRef.current = setInterval(fetchDiff, 600);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [expanded, fetchDiff]);

  const takeSnapshot = useCallback(async () => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.snapshotAttrs()`,
    ).catch(() => {});
    fetchDiff();
  }, [fetchDiff]);

  const clearSnapshot = useCallback(async () => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.clearSnapshot()`,
    ).catch(() => {});
    setDiff(null);
    setHasSnapshot(false);
  }, []);

  const changedCount = diff?.diffs.length ?? 0;

  return (
    <div className="border-t border-[var(--color-border)] px-1">
      <div
        className="flex cursor-pointer items-center py-0.5 text-[11px]"
        onClick={() => setExpanded(e => !e)}>
        <span className="inline-flex w-[15px] items-center justify-center text-[var(--color-expand-collapse-toggle)]">
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <div className="flex flex-1 items-center font-sans">
          Change Tracking
          {changedCount > 0 && (
            <span className="ml-1 rounded bg-amber-500/20 px-1 text-[9px] text-amber-500">
              {changedCount} changed
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="pb-1 pl-[15px]">
          <div className="mb-1 flex gap-1">
            <button
              className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-button-background)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
              onClick={takeSnapshot}>
              {hasSnapshot ? 'Re-snapshot' : 'Take Snapshot'}
            </button>
            {hasSnapshot && (
              <button
                className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-button-background)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
                onClick={clearSnapshot}>
                Clear
              </button>
            )}
          </div>

          {!hasSnapshot && (
            <div className="font-mono text-[10px] text-[var(--color-text)] opacity-50">
              Take a snapshot to track attribute changes over time.
            </div>
          )}

          {hasSnapshot && diff && diff.diffs.length === 0 && (
            <div className="font-mono text-[10px] text-[var(--color-text)] opacity-50">
              No changes since snapshot.
            </div>
          )}

          {diff && diff.diffs.length > 0 && (
            <div className="space-y-0.5">
              {diff.diffs.map(d => (
                <div
                  key={d.key}
                  className="flex items-baseline gap-1 font-mono text-[10px]">
                  <span
                    className={`w-1.5 flex-shrink-0 text-center text-[9px] font-bold ${
                      d.type === 'added'
                        ? 'text-green-500'
                        : d.type === 'removed'
                          ? 'text-red-500'
                          : 'text-amber-500'
                    }`}>
                    {d.type === 'added' ? '+' : d.type === 'removed' ? '-' : '~'}
                  </span>
                  <span className="text-[var(--color-attribute-name)]">{d.key}</span>
                  {d.type === 'changed' && (
                    <>
                      <span className="text-red-400/70 line-through">{JSON.stringify(d.oldValue)}</span>
                      <span className="text-[var(--color-text)]">&rarr;</span>
                      <span className="text-green-400">{JSON.stringify(d.newValue)}</span>
                    </>
                  )}
                  {d.type === 'added' && (
                    <span className="text-green-400">{JSON.stringify(d.newValue)}</span>
                  )}
                  {d.type === 'removed' && (
                    <span className="text-red-400/70 line-through">{JSON.stringify(d.oldValue)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
