import type Konva from 'konva';
import type { KonvaDevtools } from '../types';

export default function konvaDevtoolsOverlay(devtools: KonvaDevtools) {
  function formatNumber(num: number, options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }) {
    return num ? new Intl.NumberFormat(undefined, options).format(num) : 0;
  }

  function position(x: string, y: string, width: string, height: string): Partial<CSSStyleDeclaration> {
    return {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
    };
  }

  let overlayEl: HTMLDivElement | undefined;
  let raf: number | undefined;
  function connect(stageIndex = 0) {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.style.backgroundColor = 'rgba(0, 161, 255, 0.3)';
    overlayEl.style.zIndex = '99999999999';
    overlayEl.style.fontFamily = 'SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace';
    Object.assign(overlayEl.style, {
      ...position('0', '0', '0', '0'),
      pointerEvents: 'none',
      transformOrigin: 'top left',
    });

    const tooltip = document.createElement('div');
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.position = 'absolute';
    tooltip.style.top = '-35px';
    tooltip.style.left = '0';
    tooltip.style.display = 'flex';
    tooltip.style.gap = '5px';
    tooltip.style.color = 'white';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.width = 'max-content';

    const leftTooltip = document.createElement('div');
    leftTooltip.style.color = '#61dafb';

    const _idText = document.createElement('div');
    _idText.style.color = '#ef6632';

    const separator = document.createElement('div');
    separator.textContent = '|';

    const rightTooltip = document.createElement('div');

    tooltip.append(leftTooltip);
    tooltip.append(separator);
    tooltip.append(_idText);
    tooltip.append(separator.cloneNode(true));
    tooltip.append(rightTooltip);
    overlayEl.appendChild(tooltip);
    document.body.appendChild(overlayEl);

    function calibrateOverlay() {
      const content = devtools.content(stageIndex);
      const contentBounds = content.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      overlayEl!.style.transform = `translate(${contentBounds.x + scrollX}px, ${contentBounds.y + scrollY}px)`;
    }

    let throttle = 0;

    function updateHighlight() {
      raf = requestAnimationFrame(updateHighlight);
      const node = devtools.selection.active() as Konva.Node;
      if (!node) return;
      const rect = node.getClientRect();
      overlayEl!.style.top = rect.y.toString() + 'px';
      overlayEl!.style.left = rect.x.toString() + 'px';
      overlayEl!.style.width = rect.width.toString() + 'px';
      overlayEl!.style.height = rect.height.toString() + 'px';

      leftTooltip.textContent = node.getClassName();
      _idText.textContent = `_id=${node._id.toString()}`;
      rightTooltip.textContent = `${formatNumber(rect.width)}px x ${formatNumber(rect.height)}px (x: ${formatNumber(
        rect.x,
      )}, y: ${formatNumber(rect.y)})`;

      if (throttle <= 0) {
        calibrateOverlay();
        throttle = 15;
      } else {
        throttle -= 1;
      }
    }

    updateHighlight();
  }

  let hitRegionContainer: HTMLDivElement | undefined;
  let hitRegionRaf: number | undefined;
  let hitRegionActive = false;

  function showHitRegions() {
    if (hitRegionActive) return;
    hitRegionActive = true;

    hitRegionContainer = document.createElement('div');
    hitRegionContainer.id = '__konva_devtools_hit_regions__';
    Object.assign(hitRegionContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      pointerEvents: 'none',
      zIndex: '99999999998',
    });
    document.body.appendChild(hitRegionContainer);

    function isListeningBlocked(node: Konva.Node): boolean {
      let current: Konva.Node | null = node;
      while (current) {
        if (typeof current.listening === 'function' && current.listening() === false) return true;
        current = current.getParent();
      }
      return false;
    }

    function updateRegions() {
      hitRegionRaf = requestAnimationFrame(updateRegions);
      if (!hitRegionContainer || !devtools.Konva()) return;

      hitRegionContainer.innerHTML = '';

      for (let si = 0; si < devtools.Konva().stages.length; si++) {
        const stage = devtools.stage(si);
        const content = devtools.content(si);
        const contentBounds = content.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const offsetX = contentBounds.x + scrollX;
        const offsetY = contentBounds.y + scrollY;

        stage.find('Shape').forEach((shape: Konva.Shape) => {
          const rect = shape.getClientRect();
          if (rect.width === 0 && rect.height === 0) return;

          const blocked = isListeningBlocked(shape);
          const hasCustomHitFunc = typeof shape.hitFunc === 'function' && !!shape.hitFunc();
          const hasListeners = shape.eventListeners && Object.keys(shape.eventListeners).length > 0;

          let color: string;
          if (blocked) {
            color = 'rgba(239, 68, 68, 0.25)';
          } else if (hasCustomHitFunc) {
            color = 'rgba(59, 130, 246, 0.25)';
          } else if (hasListeners) {
            color = 'rgba(74, 222, 128, 0.25)';
          } else {
            color = 'rgba(156, 163, 175, 0.15)';
          }

          const el = document.createElement('div');
          Object.assign(el.style, {
            position: 'absolute',
            left: (rect.x + offsetX) + 'px',
            top: (rect.y + offsetY) + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            backgroundColor: color,
            border: `1px solid ${color.replace(/[\d.]+\)$/, '0.6)')}`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          });
          hitRegionContainer!.appendChild(el);
        });
      }
    }

    updateRegions();
  }

  function hideHitRegions() {
    hitRegionActive = false;
    if (hitRegionContainer) {
      hitRegionContainer.remove();
      hitRegionContainer = undefined;
    }
    if (hitRegionRaf) {
      cancelAnimationFrame(hitRegionRaf);
      hitRegionRaf = undefined;
    }
  }

  // --- Canvas Render Heatmap ---
  let heatmapActive = false;
  let heatmapContainer: HTMLDivElement | undefined;
  let heatmapRaf: number | undefined;
  const drawCounts: Record<number, number> = {};
  let heatmapOrigDraw: ((...args: any[]) => any) | null = null;
  let heatmapPatched = false;

  function patchForHeatmap() {
    if (heatmapPatched) return;
    const K = devtools.Konva();
    if (!K) return;
    heatmapPatched = true;
    heatmapOrigDraw = K.Layer.prototype.draw;

    const counts = drawCounts;
    K.Layer.prototype.draw = function (this: Konva.Layer) {
      counts[this._id] = (counts[this._id] || 0) + 1;
      return heatmapOrigDraw!.call(this);
    };
  }

  function unpatchHeatmap() {
    if (!heatmapPatched) return;
    heatmapPatched = false;
    const K = devtools.Konva();
    if (K && heatmapOrigDraw) {
      K.Layer.prototype.draw = heatmapOrigDraw;
    }
    heatmapOrigDraw = null;
  }

  function heatColor(intensity: number): string {
    const t = Math.min(intensity, 1);
    if (t < 0.25) return `rgba(59, 130, 246, ${0.08 + t * 0.6})`;
    if (t < 0.5) return `rgba(250, 204, 21, ${0.15 + t * 0.5})`;
    if (t < 0.75) return `rgba(251, 146, 60, ${0.25 + t * 0.4})`;
    return `rgba(239, 68, 68, ${0.35 + t * 0.4})`;
  }

  function showHeatmap() {
    if (heatmapActive) return;
    heatmapActive = true;
    patchForHeatmap();

    heatmapContainer = document.createElement('div');
    heatmapContainer.id = '__konva_devtools_heatmap__';
    Object.assign(heatmapContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      pointerEvents: 'none',
      zIndex: '99999999997',
    });
    document.body.appendChild(heatmapContainer);

    function updateHeatmap() {
      heatmapRaf = requestAnimationFrame(updateHeatmap);
      if (!heatmapContainer || !devtools.Konva()) return;

      heatmapContainer.innerHTML = '';

      const maxCount = Math.max(...Object.values(drawCounts), 1);

      for (let si = 0; si < devtools.Konva().stages.length; si++) {
        const stage = devtools.stage(si);
        const content = devtools.content(si);
        const contentBounds = content.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const offsetX = contentBounds.x + scrollX;
        const offsetY = contentBounds.y + scrollY;

        stage.getLayers().forEach((layer: Konva.Layer) => {
          const count = drawCounts[layer._id] || 0;
          if (count === 0) return;

          const rect = layer.getClientRect();
          const intensity = count / maxCount;
          const color = heatColor(intensity);

          const el = document.createElement('div');
          Object.assign(el.style, {
            position: 'absolute',
            left: (rect.x + offsetX) + 'px',
            top: (rect.y + offsetY) + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            backgroundColor: color,
            border: `1px solid ${color.replace(/[\d.]+\)$/, '0.8)')}`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          });

          const label = document.createElement('div');
          Object.assign(label.style, {
            position: 'absolute',
            top: '2px',
            left: '2px',
            padding: '1px 4px',
            fontSize: '9px',
            fontFamily: 'SFMono-Regular, Consolas, monospace',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          });
          label.textContent = `${layer.name() || 'Layer'} #${layer._id}: ${count} draws`;
          el.appendChild(label);

          heatmapContainer!.appendChild(el);
        });
      }
    }

    updateHeatmap();
  }

  function hideHeatmap() {
    heatmapActive = false;
    if (heatmapContainer) {
      heatmapContainer.remove();
      heatmapContainer = undefined;
    }
    if (heatmapRaf) {
      cancelAnimationFrame(heatmapRaf);
      heatmapRaf = undefined;
    }
    unpatchHeatmap();
  }

  function resetHeatmap() {
    for (const key in drawCounts) {
      delete drawCounts[key];
    }
  }

  // --- Transform Gizmo (uses native Konva.Transformer) ---
  let gizmoActive = false;
  let gizmoTransformer: Konva.Transformer | null = null;
  let gizmoNodeId: number | null = null;
  let gizmoPollInterval: ReturnType<typeof setInterval> | null = null;

  function showGizmo() {
    if (gizmoActive) return;
    gizmoActive = true;
    syncGizmo();
    gizmoPollInterval = setInterval(syncGizmo, 300);
  }

  function syncGizmo() {
    const K = devtools.Konva();
    if (!K) return;

    const node = devtools.selection.selected() as Konva.Node | undefined;
    if (!node) {
      detachGizmo();
      return;
    }

    if (gizmoTransformer && gizmoNodeId === node._id) return;

    detachGizmo();

    const layer = typeof node.getLayer === 'function' ? node.getLayer() : null;
    if (!layer) return;

    gizmoTransformer = new K.Transformer({
      nodes: [node],
      rotateAnchorOffset: 30,
      borderStroke: '#0af',
      borderStrokeWidth: 1,
      anchorStroke: '#0af',
      anchorFill: '#fff',
      anchorSize: 8,
      anchorCornerRadius: 1,
      rotateAnchorCursor: 'grab',
      keepRatio: false,
      name: '__devtools_transformer__',
    });
    layer.add(gizmoTransformer);
    gizmoNodeId = node._id;
  }

  function detachGizmo() {
    if (gizmoTransformer) {
      gizmoTransformer.destroy();
      gizmoTransformer = null;
    }
    gizmoNodeId = null;
  }

  function hideGizmo() {
    gizmoActive = false;
    detachGizmo();
    if (gizmoPollInterval) {
      clearInterval(gizmoPollInterval);
      gizmoPollInterval = null;
    }
  }

  return {
    connect,
    clear() {
      overlayEl && overlayEl.remove();
      overlayEl = undefined;
      raf && cancelAnimationFrame(raf);
      raf = undefined;
    },
    showHitRegions,
    hideHitRegions,
    isHitRegionsActive() {
      return hitRegionActive;
    },
    showHeatmap,
    hideHeatmap,
    resetHeatmap,
    isHeatmapActive() {
      return heatmapActive;
    },
    showGizmo,
    hideGizmo,
    isGizmoActive() {
      return gizmoActive;
    },
  };
}
