import { useCallback, useEffect, useState } from 'react';
import { bridge } from '..';
import type { EventInfo } from '../types';
import DownArrow from './icons/DownArrow';
import RightArrow from './icons/RightArrow';

export default function EventListeners() {
  const [expanded, setExpanded] = useState(true);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await bridge<EventInfo>(
        `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.getSelectedNodeEventInfo()`,
      );
      setEventInfo(data);
    } catch {
      // can fail during reload
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 500);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (!eventInfo) return null;

  const listenerEntries = Object.entries(eventInfo.listeners);
  const hasWarnings = !eventInfo.listening || !eventInfo.hitGraphEnabled || eventInfo.parentBlocksEvents;

  return (
    <div className="border-t border-[var(--color-border)] px-1">
      <div className="flex items-center">
        <div
          className="flex text-[var(--color-expand-collapse-toggle)]"
          onClick={() => setExpanded(v => !v)}>
          {expanded ? <DownArrow /> : <RightArrow />}
        </div>
        <div className="flex flex-1 items-center font-sans">
          Event Listeners
          {listenerEntries.length > 0 && (
            <span className="ml-1 font-mono text-[10px] opacity-60">({listenerEntries.length})</span>
          )}
          {hasWarnings && <span className="ml-1 text-[10px] text-amber-500" title="Event issues detected">&#9888;</span>}
        </div>
      </div>
      {expanded && (
        <div className="pb-1 pl-[15px]">
          {hasWarnings && (
            <div className="mb-1 space-y-0.5">
              {!eventInfo.listening && (
                <div className="font-mono text-[10px] text-amber-500">
                  &#9888; This node has listening=false (events disabled)
                </div>
              )}
              {!eventInfo.hitGraphEnabled && (
                <div className="font-mono text-[10px] text-amber-500">
                  &#9888; hitGraphEnabled=false (hit detection disabled)
                </div>
              )}
              {eventInfo.parentBlocksEvents && eventInfo.blockingParent && (
                <div className="font-mono text-[10px] text-amber-500">
                  &#9888; Parent {eventInfo.blockingParent} has listening=false
                </div>
              )}
            </div>
          )}
          {eventInfo.hasHitFunc && (
            <div className="font-mono text-[10px] text-[var(--color-attribute-editable-value)]">
              Custom hitFunc defined
            </div>
          )}
          {listenerEntries.length === 0 ? (
            <div className="font-mono text-[10px] opacity-50">No event listeners</div>
          ) : (
            listenerEntries.map(([name, count]) => (
              <div
                className="flex py-0.5 font-mono text-[11px] hover:rounded hover:bg-[var(--color-background-hover)]"
                key={name}>
                <span className="mr-2 text-[var(--color-attribute-name)]">{name}</span>
                <span className="text-[var(--color-attribute-editable-value)]">
                  {count} handler{count > 1 ? 's' : ''}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
