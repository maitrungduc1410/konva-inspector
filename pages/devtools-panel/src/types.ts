import type { IAttr } from './components/constants';
import type konvaDevtools from './devtools/konvaDevtools';
import type konvaDevtoolsOutline from './devtools/konvaDevtoolsOutline';
import type konvaDevtoolsOverlay from './devtools/konvaDevtoolsOverlay';
import type konvaDevtoolsSelection from './devtools/konvaDevtoolsSelection';
import type konvaDevtoolsProfiler from './devtools/konvaDevtoolsProfiler';
import type konvaDevtoolsAnimations from './devtools/konvaDevtoolsAnimations';

export type KonvaDevtools = ReturnType<typeof konvaDevtools> & {
  selection: ReturnType<typeof konvaDevtoolsSelection>;
  overlay: ReturnType<typeof konvaDevtoolsOverlay>;
  outline: ReturnType<typeof konvaDevtoolsOutline>;
  profiler: ReturnType<typeof konvaDevtoolsProfiler>;
  animations: ReturnType<typeof konvaDevtoolsAnimations>;
};

export type OutlineNode = {
  attrs: Record<string, any>;
  className: string;
  _id: number;
  isShape: boolean;
  children?: OutlineNode[];
};

export type Filter = {
  name: string;
  values: FilterItem[] | null;
  native?: boolean;
};

export type FilterItem = {
  value: any;
  renderer: IAttr;
};

export type CacheInfo = {
  isCached: boolean;
  width: number;
  height: number;
  memory: number;
};

export type EventInfo = {
  listeners: Record<string, number>;
  listening: boolean;
  hitGraphEnabled: boolean;
  hasHitFunc: boolean;
  parentBlocksEvents: boolean;
  blockingParent: string | null;
};

export type SceneStats = {
  totalNodes: number;
  shapeCount: number;
  containerCount: number;
  stageCount: number;
  layerCount: number;
  hiddenCount: number;
  cachedCount: number;
  cacheMemory: number;
  listenersCount: number;
  version: string;
};

export type ProfilerLayerSummary = {
  layerId: number;
  layerName: string;
  drawCount: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  avgTime: number;
  lastDrawTime: number;
  nodeCount: number;
};

export type ProfilerSummary = {
  totalDraws: number;
  totalTime: number;
  layers: ProfilerLayerSummary[];
  recording: boolean;
  startedAt: number;
  durationMs: number;
};

export type ProfilerRecord = {
  layerId: number;
  layerName: string;
  drawTime: number;
  timestamp: number;
  nodeCount: number;
};

export type TweenInfo = {
  tweenId: number;
  nodeId: number;
  nodeClassName: string | null;
  properties: string[];
};

export type AnimationInfo = {
  id: number;
  isRunning: boolean;
  layers: Array<{ layerId: number; layerName: string }>;
};

export type AnimationsSummary = {
  tweenCount: number;
  animationCount: number;
  tweens: TweenInfo[];
  animations: AnimationInfo[];
};

export type AttrDiff = {
  key: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'changed';
};

export type HeatmapEntry = {
  layerId: number;
  layerName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  drawCount: number;
  intensity: number;
};
