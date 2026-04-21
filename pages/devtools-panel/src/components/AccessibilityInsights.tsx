import { useCallback, useEffect, useRef, useState } from 'react';
import { bridge } from '..';

interface AccessibilityInfo {
  isInteractive: boolean;
  issues: Array<{ severity: string; message: string }>;
  issueCount: number;
}

export default function AccessibilityInsights() {
  const [expanded, setExpanded] = useState(true);
  const [info, setInfo] = useState<AccessibilityInfo | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const data = await bridge<AccessibilityInfo>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getAccessibilityInfo()`,
      );
      setInfo(data || null);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    fetchInfo();
    pollRef.current = setInterval(fetchInfo, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [expanded, fetchInfo]);

  return (
    <div className="border-t border-[var(--color-border)] px-1">
      <div
        className="flex cursor-pointer items-center py-0.5 text-[11px]"
        onClick={() => setExpanded(e => !e)}>
        <span className="inline-flex w-[15px] items-center justify-center text-[var(--color-expand-collapse-toggle)]">
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <div className="flex flex-1 items-center font-sans">
          Accessibility
          {info && info.issueCount > 0 && (
            <span className="ml-1 rounded bg-amber-500/20 px-1 text-[9px] text-amber-500">
              {info.issueCount} issue{info.issueCount !== 1 ? 's' : ''}
            </span>
          )}
          {info && info.issueCount === 0 && (
            <span className="ml-1 rounded bg-green-500/20 px-1 text-[9px] text-green-500">
              OK
            </span>
          )}
        </div>
      </div>
      {expanded && info && (
        <div className="pb-1 pl-[15px]">
          <div className="mb-1 font-mono text-[10px] text-[var(--color-text)] opacity-60">
            {info.isInteractive ? 'Interactive node (has click/tap listeners)' : 'Non-interactive node'}
          </div>
          {info.issues.length === 0 && (
            <div className="font-mono text-[10px] text-green-500">
              No accessibility issues detected.
            </div>
          )}
          {info.issues.map((issue, i) => (
            <div
              key={i}
              className="mb-0.5 flex items-start gap-1 font-mono text-[10px]">
              <span className={`mt-px flex-shrink-0 text-[9px] font-bold ${
                issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'
              }`}>
                {issue.severity === 'error' ? '\u2716' : '\u26A0'}
              </span>
              <span className="text-[var(--color-text)]">{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
