import type { SceneStats } from '../types';

interface IProps {
  stats: SceneStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StatsBar({ stats }: IProps) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text)] opacity-80">
      <span title="Konva version">v{stats.version}</span>
      <span className="text-[var(--color-border)]">|</span>
      <span title="Total nodes">{stats.totalNodes} nodes</span>
      <span title="Shapes / Containers">
        ({stats.shapeCount} shapes, {stats.containerCount} groups)
      </span>
      <span className="text-[var(--color-border)]">|</span>
      <span title="Stages / Layers">
        {stats.stageCount} {stats.stageCount === 1 ? 'Stage' : 'Stages'} / {stats.layerCount} {stats.layerCount === 1 ? 'Layer' : 'Layers'}
      </span>
      {stats.hiddenCount > 0 && (
        <>
          <span className="text-[var(--color-border)]">|</span>
          <span title="Hidden nodes">{stats.hiddenCount} hidden</span>
        </>
      )}
      {stats.cachedCount > 0 && (
        <>
          <span className="text-[var(--color-border)]">|</span>
          <span title="Cached nodes and estimated memory">
            {stats.cachedCount} cached ({formatBytes(stats.cacheMemory)})
          </span>
        </>
      )}
    </div>
  );
}
