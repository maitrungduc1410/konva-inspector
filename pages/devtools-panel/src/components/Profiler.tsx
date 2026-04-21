import { useCallback, useEffect, useRef, useState } from 'react';
import { bridge } from '..';
import type { ProfilerSummary, ProfilerRecord } from '../types';

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function timeColor(ms: number): string {
  if (ms < 2) return 'var(--profiler-fast, #4ade80)';
  if (ms < 8) return 'var(--profiler-mid, #facc15)';
  return 'var(--profiler-slow, #f87171)';
}

export default function Profiler() {
  const [summary, setSummary] = useState<ProfilerSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<ProfilerRecord[]>([]);
  const [recording, setRecording] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sum, recs] = await Promise.all([
        bridge<ProfilerSummary>(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.profiler.getSummary()`,
        ),
        bridge<ProfilerRecord[]>(
          `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.profiler.getRecentRecords(100)`,
        ),
      ]);
      if (sum) {
        setSummary(sum);
        setRecording(sum.recording);
      }
      if (recs) setRecentRecords(recs);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, recording ? 300 : 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [recording, fetchData]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.profiler.stop()`,
      ).catch(() => {});
    } else {
      await bridge(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.profiler.start()`,
      ).catch(() => {});
    }
    setRecording(r => !r);
    fetchData();
  }, [recording, fetchData]);

  const clearData = useCallback(async () => {
    await bridge(
      `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.profiler.clear()`,
    ).catch(() => {});
    fetchData();
  }, [fetchData]);

  const maxLayerTime = summary?.layers.reduce((m, l) => Math.max(m, l.totalTime), 0) || 1;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* toolbar */}
      <div className="flex h-[42px] flex-shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3">
        <button
          className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] ${
            recording
              ? 'border-red-500/50 bg-red-500/10 text-red-400'
              : 'border-[var(--color-border)] bg-[var(--color-button-background)] text-[var(--color-button)] hover:text-[var(--color-button-hover)]'
          }`}
          onClick={toggleRecording}>
          {recording ? (
            <>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
              Stop
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-button)]"></span>
              Record
            </>
          )}
        </button>
        <button
          className="cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-button-background)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-button)] hover:text-[var(--color-button-hover)]"
          onClick={clearData}>
          Clear
        </button>
        {summary && (
          <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-[var(--color-text)] opacity-70">
            <span>{summary.totalDraws} draws</span>
            <span>{formatMs(summary.totalTime)} total</span>
            {recording && <span>{(summary.durationMs / 1000).toFixed(1)}s elapsed</span>}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Layer summary */}
        {summary && summary.layers.length > 0 && (
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="mb-2 font-sans text-[12px] font-medium text-[var(--color-text)]">Layer Draw Times</div>
            <div className="space-y-2">
              {summary.layers
                .sort((a, b) => b.totalTime - a.totalTime)
                .map(layer => {
                  const barWidth = maxLayerTime > 0 ? (layer.totalTime / maxLayerTime) * 100 : 0;
                  return (
                    <div key={layer.layerId} className="space-y-0.5">
                      <div className="flex items-baseline justify-between font-mono text-[11px]">
                        <span className="text-[var(--color-component-name)]">
                          {layer.layerName}{' '}
                          <span className="text-[var(--color-attribute-value)] opacity-60">_id={layer.layerId}</span>
                        </span>
                        <span className="ml-2 flex-shrink-0 text-[10px] opacity-60">
                          {layer.nodeCount} nodes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 flex-1 overflow-hidden rounded-sm bg-[var(--color-border)]">
                          <div
                            className="h-full rounded-sm transition-all duration-200"
                            style={{
                              width: `${Math.max(barWidth, 1)}%`,
                              backgroundColor: timeColor(layer.avgTime),
                            }}
                          />
                        </div>
                        <span className="w-[60px] flex-shrink-0 text-right font-mono text-[10px] text-[var(--color-text)]">
                          {formatMs(layer.totalTime)}
                        </span>
                      </div>
                      <div className="flex gap-3 font-mono text-[9px] opacity-50">
                        <span>{layer.drawCount} draws</span>
                        <span>avg {formatMs(layer.avgTime)}</span>
                        <span>max {formatMs(layer.maxTime)}</span>
                        <span>min {formatMs(layer.minTime)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recent draws timeline */}
        {recentRecords.length > 0 && (
          <div className="p-3">
            <div className="mb-2 font-sans text-[12px] font-medium text-[var(--color-text)]">
              Recent Draws
              <span className="ml-1 font-mono text-[10px] opacity-50">(last {recentRecords.length})</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full font-mono text-[10px]">
                <thead>
                  <tr className="text-left opacity-50">
                    <th className="pb-1 pr-3 font-normal">Time</th>
                    <th className="pb-1 pr-3 font-normal">Layer</th>
                    <th className="pb-1 pr-3 text-right font-normal">Duration</th>
                    <th className="pb-1 font-normal">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recentRecords].reverse().map((rec, i) => (
                    <tr
                      key={`${rec.timestamp}-${i}`}
                      className="hover:bg-[var(--color-background-hover)]">
                      <td className="py-0.5 pr-3 opacity-50">
                        {new Date(rec.timestamp).toLocaleTimeString(undefined, {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          fractionalSecondDigits: 1,
                        } as Intl.DateTimeFormatOptions)}
                      </td>
                      <td className="py-0.5 pr-3 text-[var(--color-component-name)]">{rec.layerName}</td>
                      <td className="py-0.5 pr-3 text-right" style={{ color: timeColor(rec.drawTime) }}>
                        {formatMs(rec.drawTime)}
                      </td>
                      <td className="py-0.5">
                        <div className="h-2 w-16 overflow-hidden rounded-sm bg-[var(--color-border)]">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${Math.min((rec.drawTime / 16) * 100, 100)}%`,
                              backgroundColor: timeColor(rec.drawTime),
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!summary || summary.totalDraws === 0) && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center opacity-50">
            <div className="text-[24px]">&#9201;</div>
            <div className="font-sans text-[13px] text-[var(--color-text)]">
              Click <b>Record</b> to start profiling layer draw performance.
            </div>
            <div className="max-w-[280px] font-mono text-[10px] text-[var(--color-text)]">
              The profiler patches Konva.Layer.draw() to measure render times per layer. Interact with your app while
              recording to capture draw calls.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
