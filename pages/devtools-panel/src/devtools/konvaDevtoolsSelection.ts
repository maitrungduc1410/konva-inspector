import type Konva from 'konva';
import type { Filter, KonvaDevtools, OutlineNode } from '../types';
import type { IAttr } from '../components/constants';

export default function konvaDevtoolsSelection(devtools: KonvaDevtools) {
  let activeNode: Konva.Container;
  let activeNodeStageIndex: number | null;
  let selectedNode: Konva.Container;
  let selectedNodeStageIndex: number | null;
  let alwaysInspect = false;

  let attrSnapshot: Record<string, any> | null = null;
  let snapshotNodeId: number | null = null;

  // memoize handler so that we can remove it later
  // note: do not clear handlers after unregisterMouseOverEvents, otherwise we'll lost reference to remove and the toggle button from React won't work anymore
  const handlers = {};

  const FILTER_RENDERERS: Array<{ name: string; values: IAttr[] }> = [
    {
      name: 'Blur',
      values: [{ name: 'blurRadius', type: 'number', min: 0 }],
    },
    {
      name: 'Brighten',
      values: [{ name: 'brightness', type: 'number', min: -1, max: 1, step: 0.05 }],
    },
    {
      name: 'Brightness',
      values: [{ name: 'brightness', type: 'number', min: -1, max: 1, step: 0.05 }],
    },
    {
      name: 'Contrast',
      values: [{ name: 'contrast', type: 'number', min: -100, max: 100 }],
    },
    {
      name: 'Emboss',
      values: [
        { name: 'embossStrength', type: 'number', min: 0, max: 1, step: 0.1 },
        { name: 'embossWhiteLevel', type: 'number', min: 0, max: 1, step: 0.1 },
        {
          name: 'embossDirection',
          type: 'select',
          options: [
            { value: 'top', label: 'Top' },
            { value: 'top-left', label: 'Top Left' },
            { value: 'top-right', label: 'Top Right' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'bottom-left', label: 'Bottom Left' },
            { value: 'bottom-right', label: 'Bottom Right' },
          ],
        },
        {
          name: 'embossBlend',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'Enhance',
      values: [{ name: 'enhance', type: 'number', min: -1, max: 1, step: 0.01 }],
    },
    {
      name: 'Grayscale',
      values: null,
    },
    {
      name: 'HSL',
      values: [
        { name: 'hue', type: 'number', min: 0, max: 259 },
        { name: 'saturation', type: 'number', min: -2, max: 10, step: 0.5 },
        { name: 'luminance', type: 'number', min: -2, max: 2, step: 0.1 },
      ],
    },
    {
      name: 'HSV',
      values: [
        { name: 'hue', type: 'number', min: 0, max: 259 },
        { name: 'saturation', type: 'number', min: -2, max: 10, step: 0.5 },
        { name: 'value', type: 'number', min: -2, max: 2, step: 0.1 },
      ],
    },
    {
      name: 'Invert',
      values: null,
    },
    {
      name: 'Kaleidoscope',
      values: [
        { name: 'kaleidoscopePower', type: 'number', min: 0 },
        { name: 'kaleidoscopeAngle', type: 'number', min: 0 },
      ],
    },
    {
      name: 'Mask',
      values: [{ name: 'threshold', type: 'number', min: 0 }],
    },
    {
      name: 'Noise',
      values: [{ name: 'noise', type: 'number', min: 0, step: 0.1 }],
    },
    {
      name: 'Pixelate',
      values: [{ name: 'pixelSize', type: 'number', min: 1 }],
    },
    {
      name: 'Posterize',
      values: [{ name: 'levels', type: 'number', min: 0, max: 1, step: 0.01 }],
    },
    {
      name: 'RGB',
      values: [
        { name: 'red', type: 'number', min: 0, max: 256 },
        { name: 'green', type: 'number', min: 0, max: 256 },
        { name: 'blue', type: 'number', min: 0, max: 256 },
      ],
    },
    {
      name: 'RGBA',
      values: [
        { name: 'red', type: 'number', min: 0, max: 256 },
        { name: 'green', type: 'number', min: 0, max: 256 },
        { name: 'blue', type: 'number', min: 0, max: 256 },
        { name: 'alpha', type: 'number', min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      name: 'Sepia',
      values: null,
    },
    {
      name: 'Solarize',
      values: null,
    },
    {
      name: 'Threshold',
      values: [{ name: 'threshold', type: 'number', min: 0, max: 1, step: 0.01 }],
    },
  ];

  return {
    active(serialize = false): Konva.Node | OutlineNode | undefined {
      if (!activeNode) return undefined;
      return serialize ? devtools.outline.toObject(activeNode) : activeNode;
    },
    selected(serialize = false, withStageIndex = false) {
      if (!selectedNode) return undefined;
      const node = serialize ? devtools.outline.toObject(selectedNode) : selectedNode;

      if (withStageIndex) {
        return {
          node,
          stageIndex: selectedNodeStageIndex,
        };
      }
      return node;
    },
    select(_id: number, stageIndex = 0, scrollToElement = false): OutlineNode {
      if (!activeNode) {
        return;
      }
      const n = devtools.outline.select(_id, stageIndex, false) as Konva.Container;
      selectedNode = n;
      selectedNodeStageIndex = stageIndex;
      (window as any).$konva = n;

      if (scrollToElement) {
        const stage = devtools.stage(stageIndex);
        const rect = n.getClientRect();
        const canvasBox = stage.container().getBoundingClientRect();
        const scrollEl = document.scrollingElement || document.documentElement;
        scrollEl.scrollTo({
          top: scrollEl.scrollTop + canvasBox.top + rect.y - window.innerHeight / 2,
          left: scrollEl.scrollLeft + canvasBox.left + rect.x - window.innerWidth / 2,
          behavior: 'smooth',
        });
      }

      return devtools.outline.toObject(n);
    },
    activate(_id: number, stageIndex = 0) {
      const n = devtools.outline.select(_id, stageIndex, false) as Konva.Container;
      activeNode = n;
      activeNodeStageIndex = stageIndex;

      // we need to clear before connect to make sure it works in case of multi stages
      devtools.overlay.clear();
      devtools.overlay.connect(stageIndex);
    },
    deactivate() {
      activeNode = undefined;
      activeNodeStageIndex = null;
      devtools.overlay.clear();
    },
    deselect() {
      selectedNode = undefined;
      selectedNodeStageIndex = null;
      activeNode = undefined;
      activeNodeStageIndex = null;
      (window as any).$konva = undefined;
      devtools.overlay.clear();
    },
    updateAttrs(attrs: Record<string, string | number | boolean>) {
      const { image, ...rest } = attrs;
      if (image) {
        (() => {
          const newImg = new Image();
          newImg.onload = () => {
            (devtools.selection.selected() as unknown as Konva.Image).image(newImg);
          };
          newImg.src = image as string;
        })();
      } else {
        selectedNode.setAttrs(rest);
      }
    },
    registerMouseOverEvents() {
      // always check this to make sure Konva is still presented in host page
      if (!devtools.Konva()) {
        return;
      }
      // we check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      for (const [index, stage] of devtools.Konva().stages.entries()) {
        stage.content.addEventListener('mouseleave', devtools.selection.deactivateOnMouseLeaveWhenAlwaysInspect);
        stage.on('mouseover', devtools.selection.selectShapeAtCursor(stage, index));
        stage.on('click', devtools.selection.unregisterMouseOverEvents);
      }
      devtools.selection.setAlwaysInspect(true);
      1; // add this line so that it'll be returned when evaluation, otherwise it'll throw error because the evaluation returns object class
    },
    unregisterMouseOverEvents() {
      // always check this to make sure Konva is still presented in host page
      if (!devtools.Konva()) {
        return;
      }
      // we check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      for (const [index, stage] of devtools.Konva().stages.entries()) {
        stage.content.removeEventListener('mouseleave', devtools.selection.deactivateOnMouseLeaveWhenAlwaysInspect);
        stage.off('mouseover', devtools.selection.selectShapeAtCursor(stage, index));
        stage.off('click', devtools.selection.unregisterMouseOverEvents);
      }
      if (activeNode) {
        devtools.selection.select(activeNode._id, activeNodeStageIndex);
        devtools.selection.deactivate();
        devtools.selection.setAlwaysInspect(false);
        1; // add this line so that it'll be returned when evaluation, otherwise it'll throw error because the evaluation returns object class
      }
    },
    deactivateOnMouseLeaveWhenAlwaysInspect() {
      devtools.selection.deactivate();
    },
    selectShapeAtCursor(stage: Konva.Stage, stageIndex: number) {
      return (
        handlers[stageIndex] ||
        (handlers[stageIndex] = function () {
          const pointerPosition = stage.getPointerPosition();
          if (pointerPosition) {
            const node = stage.getIntersection(pointerPosition);
            if (node) {
              devtools.selection.activate(node._id, stageIndex);
            }
          }
        })
      );
    },
    setAlwaysInspect(value: boolean) {
      alwaysInspect = value;
    },
    getAlwaysInspect() {
      return alwaysInspect;
    },
    logSelectedToConsole() {
      console.log(selectedNode);
    },
    exportStageJSON(stageIndex = 0) {
      if (!devtools.Konva()) return null;
      const stage = devtools.stage(stageIndex);
      return stage.toJSON();
    },
    exportSelectedJSON() {
      if (!selectedNode) return null;
      return selectedNode.toJSON();
    },
    copySelectedAsCode() {
      if (!selectedNode) return null;
      const className = selectedNode.getClassName();
      const attrs = selectedNode.getAttrs();
      const cleanAttrs: Record<string, any> = {};
      for (const key in attrs) {
        const val = attrs[key];
        if (
          typeof val === 'string' ||
          typeof val === 'number' ||
          typeof val === 'boolean' ||
          Array.isArray(val)
        ) {
          cleanAttrs[key] = val;
        }
      }
      return `new Konva.${className}(${JSON.stringify(cleanAttrs, null, 2)})`;
    },
    importJSON(json: string, stageIndex = 0) {
      if (!devtools.Konva()) return false;
      try {
        const parsed = JSON.parse(json);
        const K = devtools.Konva();
        const stage = devtools.stage(stageIndex);

        if (parsed.className === 'Stage') {
          const children = parsed.children || [];
          for (const childData of children) {
            const child = K.Node.create(JSON.stringify(childData));
            stage.add(child);
          }
        } else {
          const node = K.Node.create(json);
          if (selectedNode && typeof (selectedNode as any).add === 'function') {
            (selectedNode as any).add(node);
          } else {
            const layers = stage.getLayers();
            if (layers.length > 0) {
              layers[0].add(node);
            }
          }
        }
        return true;
      } catch (e) {
        console.error('Konva DevTools: import failed', e);
        return false;
      }
    },
    getSelectedNodeFilters() {
      // always check this to make sure Konva is still presented in host page
      if (!devtools.Konva()) {
        return [];
      }
      const hostPageFilters = devtools.Konva().Filters;
      return (
        selectedNode
          .filters()
          ?.map(item => {
            // v10 native CSS filter strings (e.g. 'blur(10px)')
            if (typeof item === 'string') {
              return { name: item, values: null, native: true } as Filter;
            }

            // v9/v10 function-based filters
            const filter = Object.keys(hostPageFilters).find(key => item === hostPageFilters[key]);
            const renderer = FILTER_RENDERERS.find(i => i.name === filter);

            if (!renderer) return null;

            const payload: Filter = {
              name: renderer.name,
              values: renderer.values ? [] : null,
            };
            for (const value of renderer.values || []) {
              payload.values.push({
                value: selectedNode[value.name](),
                renderer: value,
              });
            }
            return payload;
          })
          .filter(Boolean) || []
      );
    },
    removeSelectedNodeFilterAtIndex(index: number) {
      const currentFilters = selectedNode.filters();
      currentFilters.splice(index, 1);
      selectedNode.filters(currentFilters);
    },
    addFilterToSelectedNode(filter: string) {
      if (!selectedNode.isCached()) {
        selectedNode.cache();
      }

      const currentFilters = selectedNode.filters();
      const newFilter = devtools.Konva().Filters[filter];

      if (!currentFilters) {
        selectedNode.filters([newFilter]);
      } else {
        currentFilters.push(newFilter);
        selectedNode.filters(currentFilters);
      }
    },
    supportsNativeFilters() {
      const ver = devtools.Konva().version;
      if (!ver) return false;
      const major = parseInt(ver.split('.')[0], 10);
      return major >= 10;
    },
    addNativeFilterToSelectedNode(cssFilter: string) {
      if (!selectedNode.isCached()) {
        selectedNode.cache();
      }

      const currentFilters = selectedNode.filters();
      if (!currentFilters) {
        selectedNode.filters([cssFilter]);
      } else {
        currentFilters.push(cssFilter);
        selectedNode.filters(currentFilters);
      }
    },
    getSelectedNodeCacheInfo() {
      if (!selectedNode || !devtools.Konva()) return null;
      const isCached = selectedNode.isCached();
      if (!isCached) return { isCached: false, width: 0, height: 0, memory: 0 };

      let width = 0;
      let height = 0;
      const cache = (selectedNode as any)._cache;
      if (cache) {
        const canvas = cache.get ? cache.get('canvas') : cache.canvas;
        if (canvas?.scene) {
          width = canvas.scene.width || 0;
          height = canvas.scene.height || 0;
        }
      }
      return { isCached: true, width, height, memory: width * height * 4 };
    },
    clearSelectedNodeCache() {
      if (selectedNode && selectedNode.isCached()) {
        selectedNode.clearCache();
      }
    },
    cacheSelectedNode() {
      if (selectedNode && !selectedNode.isCached()) {
        selectedNode.cache();
      }
    },
    getSelectedNodeEventInfo() {
      if (!selectedNode || !devtools.Konva()) return null;

      const listeners: Record<string, number> = {};
      const evtListeners = selectedNode.eventListeners || {};
      for (const evtName in evtListeners) {
        if (evtListeners[evtName]?.length > 0) {
          listeners[evtName] = evtListeners[evtName].length;
        }
      }

      let parentBlocksEvents = false;
      let blockingParent: string | null = null;
      let current = selectedNode as Konva.Node;
      while (current.getParent()) {
        const parent = current.getParent();
        if (parent.listening && parent.listening() === false) {
          parentBlocksEvents = true;
          blockingParent = `${parent.getClassName()} (_id=${parent._id})`;
          break;
        }
        current = parent;
      }

      return {
        listeners,
        listening: typeof selectedNode.listening === 'function' ? selectedNode.listening() : true,
        hitGraphEnabled:
          typeof (selectedNode as any).hitGraphEnabled === 'function'
            ? (selectedNode as any).hitGraphEnabled()
            : true,
        hasHitFunc: typeof (selectedNode as any).hitFunc === 'function' && !!(selectedNode as any).hitFunc(),
        parentBlocksEvents,
        blockingParent,
      };
    },
    snapshotAttrs() {
      if (!selectedNode) return false;
      const attrs = selectedNode.getAttrs();
      attrSnapshot = {};
      snapshotNodeId = selectedNode._id;
      for (const key in attrs) {
        const val = attrs[key];
        if (
          typeof val === 'string' ||
          typeof val === 'number' ||
          typeof val === 'boolean' ||
          val === null ||
          val === undefined ||
          Array.isArray(val)
        ) {
          attrSnapshot[key] = JSON.parse(JSON.stringify(val));
        }
      }
      return true;
    },
    clearSnapshot() {
      attrSnapshot = null;
      snapshotNodeId = null;
    },
    getAttrDiff() {
      if (!attrSnapshot || !selectedNode || selectedNode._id !== snapshotNodeId) return null;

      const diffs: Array<{ key: string; oldValue: any; newValue: any; type: string }> = [];
      const currentAttrs = selectedNode.getAttrs();

      const allKeys = new Set([...Object.keys(attrSnapshot), ...Object.keys(currentAttrs)]);
      for (const key of allKeys) {
        const oldVal = attrSnapshot[key];
        const curRaw = currentAttrs[key];
        let newVal = curRaw;
        if (
          typeof curRaw !== 'string' &&
          typeof curRaw !== 'number' &&
          typeof curRaw !== 'boolean' &&
          curRaw !== null &&
          curRaw !== undefined &&
          !Array.isArray(curRaw)
        ) {
          continue;
        }

        const oldStr = JSON.stringify(oldVal);
        const newStr = JSON.stringify(newVal);

        if (!(key in attrSnapshot)) {
          diffs.push({ key, oldValue: undefined, newValue: newVal, type: 'added' });
        } else if (!(key in currentAttrs)) {
          diffs.push({ key, oldValue: oldVal, newValue: undefined, type: 'removed' });
        } else if (oldStr !== newStr) {
          diffs.push({ key, oldValue: oldVal, newValue: newVal, type: 'changed' });
        }
      }
      return { nodeId: snapshotNodeId, diffs };
    },
    hasSnapshot() {
      return attrSnapshot !== null && snapshotNodeId !== null;
    },
    moveNode(nodeId: number, targetId: number, position: string, stageIndex = 0) {
      if (!devtools.Konva()) return false;
      const stage = devtools.stage(stageIndex);
      const node = stage.findOne((n: any) => n._id === nodeId);
      const target = stage._id === targetId ? stage : stage.findOne((n: any) => n._id === targetId);
      if (!node || !target) return false;

      try {
        if (position === 'inside') {
          if (typeof (target as any).add === 'function') {
            (target as any).add(node);
          }
        } else if (position === 'before') {
          const parent = target.getParent();
          if (parent) {
            const idx = parent.getChildren().indexOf(target);
            node.remove();
            parent.add(node);
            if (idx >= 0) node.setZIndex(idx);
          }
        } else if (position === 'after') {
          const parent = target.getParent();
          if (parent) {
            const idx = parent.getChildren().indexOf(target);
            node.remove();
            parent.add(node);
            if (idx >= 0) node.setZIndex(idx + 1);
          }
        }
        return true;
      } catch (e) {
        console.error('Konva DevTools: moveNode failed', e);
        return false;
      }
    },
    getAccessibilityInfo() {
      if (!selectedNode || !devtools.Konva()) return null;
      const issues: Array<{ severity: string; message: string }> = [];

      const listeners = selectedNode.eventListeners || {};
      const interactiveEvents = ['click', 'tap', 'mousedown', 'touchstart', 'pointerdown', 'dblclick', 'dbltap'];
      const isInteractive = interactiveEvents.some(evt => listeners[evt]?.length > 0);

      if (isInteractive) {
        const name = typeof selectedNode.name === 'function' ? selectedNode.name() : '';
        const id = selectedNode.id ? (typeof selectedNode.id === 'function' ? selectedNode.id() : '') : '';
        if (!name && !id) {
          issues.push({ severity: 'warning', message: 'Interactive node has no name or id attribute — hard to identify for debugging and accessibility' });
        }
      }

      if (selectedNode.getClassName() !== 'Stage' && selectedNode.getClassName() !== 'Layer') {
        const rect = selectedNode.getClientRect();
        if (isInteractive && (rect.width < 20 || rect.height < 20)) {
          issues.push({ severity: 'warning', message: `Hit area is very small (${Math.round(rect.width)}×${Math.round(rect.height)}px) — may be hard to tap on touch devices (recommend ≥44×44px)` });
        }
      }

      if (isInteractive && typeof selectedNode.listening === 'function' && selectedNode.listening() === false) {
        issues.push({ severity: 'error', message: 'Node has event listeners but listening is false — events will never fire' });
      }

      if (isInteractive) {
        let current = selectedNode as Konva.Node;
        while (current.getParent()) {
          const parent = current.getParent();
          if (parent.listening && parent.listening() === false) {
            issues.push({ severity: 'error', message: `Parent "${parent.getClassName()} (_id=${parent._id})" has listening=false — blocks all child events` });
            break;
          }
          current = parent;
        }
      }

      const opacity = typeof selectedNode.opacity === 'function' ? selectedNode.opacity() : 1;
      if (opacity < 0.1 && isInteractive) {
        issues.push({ severity: 'warning', message: `Node is nearly invisible (opacity=${opacity}) but has event listeners — may confuse users` });
      }

      const visible = typeof selectedNode.visible === 'function' ? selectedNode.visible() : true;
      if (!visible && isInteractive) {
        issues.push({ severity: 'error', message: 'Node is hidden (visible=false) but has event listeners — events won\'t fire on hidden nodes' });
      }

      return { isInteractive, issues, issueCount: issues.length };
    },
    screenshotStage(stageIndex = 0) {
      if (!devtools.Konva()) return null;
      try {
        const stage = devtools.stage(stageIndex);
        return stage.toDataURL({ pixelRatio: 2 });
      } catch (e) {
        console.error('Konva DevTools: screenshotStage failed', e);
        return null;
      }
    },
    screenshotSelected() {
      if (!selectedNode || !devtools.Konva()) return null;
      try {
        return (selectedNode as any).toDataURL({ pixelRatio: 2 });
      } catch (e) {
        console.error('Konva DevTools: screenshotSelected failed', e);
        return null;
      }
    },
    renderedBy(_id: number, stageIndex = 0) {
      if (!devtools.Konva()) {
        return [];
      }

      const stage = devtools.stage(stageIndex);

      if (stage._id === _id) {
        return [];
      }

      const item = stage.findOne(n => n._id === _id);

      if (item) {
        const parentStacks = [];
        let current = item;
        while (current.getParent()) {
          const currentParent = current.getParent();
          parentStacks.push(devtools.outline.toObject(currentParent));
          current = currentParent;
        }
        return parentStacks;
      }

      return [];
    },
  };
}
