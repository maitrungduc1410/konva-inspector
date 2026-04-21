import { useCallback, useEffect, useRef, useState } from 'react';
import { bridge } from '..';
import type { AnimationsSummary } from '../types';

export default function AnimationTracker() {
  const [summary, setSummary] = useState<AnimationsSummary | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await bridge<AnimationsSummary>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.animations.getSummary()`,
      );
      if (data) setSummary(data);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  const hasAnything = summary && (summary.animations.length > 0 || summary.tweens.length > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-[42px] flex-shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-text)]">
          <span className={`inline-block h-2 w-2 rounded-full ${hasAnything ? 'animate-pulse bg-green-500' : 'bg-[var(--color-border)]'}`} />
          Live
        </div>
        {summary && (
          <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-[var(--color-text)] opacity-70">
            <span>{summary.animationCount} animation{summary.animationCount !== 1 ? 's' : ''}</span>
            <span>{summary.tweenCount} tween{summary.tweenCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {summary && summary.animations.length > 0 && (
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="mb-2 font-sans text-[12px] font-medium text-[var(--color-text)]">
              Running Animations
              <span className="ml-1 font-mono text-[10px] opacity-50">({summary.animations.length})</span>
            </div>
            <div className="space-y-1.5">
              {summary.animations.map((a, i) => (
                <div
                  key={`anim-${a.id}-${i}`}
                  className="rounded border border-[var(--color-border)] px-2 py-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-component-name)]">
                      Animation
                      <span className="ml-1 text-[var(--color-attribute-value)] opacity-60">id={a.id}</span>
                    </span>
                    <span className="rounded bg-green-500/15 px-1 text-[9px] text-green-400">
                      running
                    </span>
                  </div>
                  {a.layers.length > 0 && (
                    <div className="mt-0.5 opacity-60">
                      layers: {a.layers.map(l => `${l.layerName} (_id=${l.layerId})`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary && summary.tweens.length > 0 && (
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="mb-2 font-sans text-[12px] font-medium text-[var(--color-text)]">
              Active Tweens
              <span className="ml-1 font-mono text-[10px] opacity-50">({summary.tweens.length})</span>
            </div>
            <div className="space-y-1.5">
              {summary.tweens.map((t, i) => (
                <div
                  key={`tween-${t.tweenId}-${t.nodeId}-${i}`}
                  className="rounded border border-[var(--color-border)] px-2 py-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-component-name)]">
                      {t.nodeClassName ?? 'Node'}
                      <span className="ml-1 text-[var(--color-attribute-value)] opacity-60">
                        _id={t.nodeId}
                      </span>
                    </span>
                    <span className="rounded bg-blue-500/15 px-1 text-[9px] text-blue-400">
                      tween #{t.tweenId}
                    </span>
                  </div>
                  {t.properties.length > 0 && (
                    <div className="mt-0.5 opacity-60">
                      properties: {t.properties.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasAnything && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center opacity-50">
            <div className="text-[24px]">&#9654;</div>
            <div className="font-sans text-[13px] text-[var(--color-text)]">
              No active animations or tweens detected.
            </div>
            <div className="max-w-[280px] font-mono text-[10px] text-[var(--color-text)]">
              This tab reads Konva&apos;s internal animation loop (<code>Animation.animations</code>) and
              tween registry (<code>Tween.attrs</code>) in real time. Active animations and tweens will
              appear here automatically.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
