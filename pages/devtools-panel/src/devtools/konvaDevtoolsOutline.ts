import type Konva from 'konva';
import type { KonvaDevtools, OutlineNode } from '../types';
import type { Node } from 'konva/lib/Node';

/**
 * Treeview operations
 */
export default function konvaDevtoolsOutline(devtools: KonvaDevtools) {
  function buildTree(node: Konva.Container | Konva.Node): OutlineNode {
    const obj = toObject(node);

    if (node.hasChildren()) {
      obj.children = [];
      (node as Konva.Container).getChildren().forEach((child: Konva.Container) => {
        obj.children.push(buildTree(child));
      });
    }

    return obj;
  }

  // we create our own version of toObject based on toObject function from Konva
  // the purpose of this is to allows us add any custom fields as we want
  function toObject(node: Konva.Node): OutlineNode {
    // eslint-disable-next-line prefer-const
    let obj: Partial<OutlineNode> = {},
      // eslint-disable-next-line prefer-const
      attrs = node.getAttrs(),
      key,
      val,
      getter,
      defaultValue,
      nonPlainObject;

    obj.attrs = {};

    const className = node.getClassName();

    for (key in attrs) {
      val = attrs[key];
      // if value is object and object is not plain
      // like class instance, we should skip it and to not include
      nonPlainObject =
        devtools.Konva().Util.isObject(val) &&
        !devtools.Konva().Util._isPlainObject(val) &&
        !devtools.Konva().Util._isArray(val);
      if (nonPlainObject) {
        if (className === 'Image') {
          obj.attrs.image = val.src;
        }

        continue;
      }
      getter = typeof node[key] === 'function' && node[key];
      // remove attr value so that we can extract the default value from the getter
      delete attrs[key];
      defaultValue = getter ? getter.call(node) : null;
      // restore attr value
      attrs[key] = val;
      if (defaultValue !== val) {
        obj.attrs[key] = val;
      }
    }

    obj.className = className;
    obj._id = node._id;
    obj.isShape = node instanceof devtools.Konva().Shape;
    return devtools.Konva().Util._prepareToStringify(obj);
  }

  function collectStats(node: Konva.Container | Konva.Node, out: {
    totalNodes: number;
    shapeCount: number;
    containerCount: number;
    layerCount: number;
    hiddenCount: number;
    cachedCount: number;
    cacheMemory: number;
    listenersCount: number;
  }) {
    out.totalNodes++;
    const isShape = node instanceof devtools.Konva().Shape;
    if (isShape) {
      out.shapeCount++;
    } else {
      out.containerCount++;
    }
    if (node.getClassName() === 'Layer') {
      out.layerCount++;
    }
    if (node.visible() === false) {
      out.hiddenCount++;
    }
    if (node.isCached()) {
      out.cachedCount++;
      const canvas = (node as any)._cache?.get?.('canvas');
      if (canvas?.scene) {
        const w = canvas.scene.width || 0;
        const h = canvas.scene.height || 0;
        out.cacheMemory += w * h * 4;
      }
    }
    const listeners = node.eventListeners || {};
    for (const evtName in listeners) {
      if (listeners[evtName]?.length > 0) {
        out.listenersCount++;
        break;
      }
    }
    if (node.hasChildren()) {
      (node as Konva.Container).getChildren().forEach((child: Konva.Node) => {
        collectStats(child as Konva.Container, out);
      });
    }
  }

  return {
    trees(): OutlineNode[] {
      if (!devtools.Konva()) return [];

      const results = [];

      for (const stage of devtools.Konva().stages) {
        results.push(buildTree(stage));
      }
      return results;
    },
    stats() {
      if (!devtools.Konva()) return null;
      const out = {
        totalNodes: 0,
        shapeCount: 0,
        containerCount: 0,
        stageCount: devtools.Konva().stages.length,
        layerCount: 0,
        hiddenCount: 0,
        cachedCount: 0,
        cacheMemory: 0,
        listenersCount: 0,
        version: devtools.Konva().version || 'unknown',
      };
      for (const stage of devtools.Konva().stages) {
        collectStats(stage, out);
      }
      return out;
    },
    select(_id: number, stageIndex = 0, serialize = true) {
      if (!devtools.Konva()) return undefined;

      const stage = devtools.stage(stageIndex);
      if (stage._id === _id) return serialize ? toObject(stage) : stage;
      const item = stage.findOne((n: Node) => n._id === _id);
      if (item) return serialize ? toObject(item) : item;

      return undefined;
    },
    toObject,
  };
}
