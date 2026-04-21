import type Konva from 'konva';
import type { KonvaDevtools } from '../types';

export default function konvaDevtoolsProfiler(devtools: KonvaDevtools) {
  let recording = false;
  let records: Array<{
    layerId: number;
    layerName: string;
    drawTime: number;
    timestamp: number;
    nodeCount: number;
  }> = [];
  let originalDraw: ((...args: any[]) => any) | null = null;
  let startedAt = 0;

  return {
    start() {
      if (recording) return;
      const K = devtools.Konva();
      if (!K) return;

      recording = true;
      records = [];
      startedAt = Date.now();

      if (!originalDraw) {
        originalDraw = K.Layer.prototype.draw;
      }

      const self = this;
      K.Layer.prototype.draw = function (this: Konva.Layer) {
        const t0 = performance.now();
        const result = originalDraw!.call(this);
        const elapsed = performance.now() - t0;

        if (recording) {
          let count = 0;
          const walk = (n: Konva.Node) => {
            count++;
            if ((n as any).getChildren) {
              (n as any).getChildren().forEach(walk);
            }
          };
          walk(this);

          records.push({
            layerId: this._id,
            layerName: this.name() || `Layer`,
            drawTime: Math.round(elapsed * 100) / 100,
            timestamp: Date.now(),
            nodeCount: count,
          });

          if (records.length > 5000) {
            records = records.slice(-2500);
          }
        }

        return result;
      };
    },
    stop() {
      if (!recording) return;
      recording = false;
      const K = devtools.Konva();
      if (K && originalDraw) {
        K.Layer.prototype.draw = originalDraw;
      }
    },
    clear() {
      records = [];
      startedAt = Date.now();
    },
    isRecording() {
      return recording;
    },
    getSummary() {
      const layerMap: Record<number, {
        layerId: number;
        layerName: string;
        drawCount: number;
        totalTime: number;
        maxTime: number;
        minTime: number;
        avgTime: number;
        lastDrawTime: number;
        nodeCount: number;
      }> = {};

      for (const r of records) {
        if (!layerMap[r.layerId]) {
          layerMap[r.layerId] = {
            layerId: r.layerId,
            layerName: r.layerName,
            drawCount: 0,
            totalTime: 0,
            maxTime: 0,
            minTime: Infinity,
            avgTime: 0,
            lastDrawTime: 0,
            nodeCount: r.nodeCount,
          };
        }
        const s = layerMap[r.layerId];
        s.drawCount++;
        s.totalTime = Math.round((s.totalTime + r.drawTime) * 100) / 100;
        s.maxTime = Math.max(s.maxTime, r.drawTime);
        s.minTime = Math.min(s.minTime, r.drawTime);
        s.lastDrawTime = r.drawTime;
        s.nodeCount = r.nodeCount;
      }

      const layers = Object.values(layerMap).map(s => ({
        ...s,
        avgTime: s.drawCount > 0 ? Math.round((s.totalTime / s.drawCount) * 100) / 100 : 0,
        minTime: s.minTime === Infinity ? 0 : s.minTime,
      }));

      return {
        totalDraws: records.length,
        totalTime: Math.round(records.reduce((sum, r) => sum + r.drawTime, 0) * 100) / 100,
        layers,
        recording,
        startedAt,
        durationMs: Date.now() - startedAt,
      };
    },
    getRecentRecords(limit = 50) {
      return records.slice(-limit);
    },
  };
}
