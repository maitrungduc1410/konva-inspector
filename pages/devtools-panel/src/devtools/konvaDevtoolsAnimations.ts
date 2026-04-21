import type Konva from 'konva';
import type { KonvaDevtools } from '../types';

export default function konvaDevtoolsAnimations(devtools: KonvaDevtools) {
  return {
    getSummary() {
      const K = devtools.Konva();
      if (!K) return { tweenCount: 0, animationCount: 0, tweens: [], animations: [] };

      const animations = this.getAnimations();
      const tweens = this.getTweens();

      return {
        tweenCount: tweens.length,
        animationCount: animations.length,
        tweens,
        animations,
      };
    },
    getAnimations() {
      const K = devtools.Konva();
      if (!K || !K.Animation) return [];

      const activeStageIds = new Set(K.stages.map((s: Konva.Stage) => s._id));

      const runningAnims: any[] = (K.Animation as any).animations || [];
      const out: any[] = [];
      for (let i = 0; i < runningAnims.length; i++) {
        const anim = runningAnims[i];
        const layers = anim.layers || [];
        const liveLayers = layers.filter((l: any) => {
          const stage = typeof l.getStage === 'function' ? l.getStage() : null;
          return stage && activeStageIds.has(stage._id);
        });
        if (layers.length > 0 && liveLayers.length === 0) continue;

        out.push({
          id: anim.id ?? i,
          isRunning: typeof anim.isRunning === 'function' ? anim.isRunning() : true,
          layers: liveLayers.map((l: Konva.Layer) => ({
            layerId: l._id,
            layerName: (typeof l.name === 'function' ? l.name() : '') || 'Layer',
          })),
        });
      }
      return out;
    },
    getTweens() {
      const K = devtools.Konva();
      if (!K || !K.Tween) return [];

      const tweenAttrs: Record<string, Record<string, Record<string, any>>> =
        (K.Tween as any).attrs || {};
      const out: any[] = [];

      for (const nodeIdStr in tweenAttrs) {
        const nodeId = Number(nodeIdStr);
        const tweensForNode = tweenAttrs[nodeIdStr];
        if (!tweensForNode || typeof tweensForNode !== 'object') continue;

        let node: Konva.Node | null = null;
        for (const stage of K.stages) {
          if (stage._id === nodeId) { node = stage; break; }
          const found = stage.findOne((n: Konva.Node) => n._id === nodeId);
          if (found) { node = found; break; }
        }

        if (!node) continue;

        const propsByTween: Record<string, string[]> = {};
        for (const tweenId in tweensForNode) {
          const attrs = tweensForNode[tweenId];
          if (!attrs || typeof attrs !== 'object') continue;
          const keys = Object.keys(attrs);
          if (keys.length > 0) propsByTween[tweenId] = keys;
        }

        for (const tweenId in propsByTween) {
          out.push({
            tweenId: Number(tweenId),
            nodeId,
            nodeClassName: typeof (node as any).getClassName === 'function' ? (node as any).getClassName() : null,
            properties: propsByTween[tweenId],
          });
        }
      }

      return out;
    },
  };
}
