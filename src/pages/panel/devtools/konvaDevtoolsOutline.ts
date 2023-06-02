import type Konva from "konva";
import { KonvaDevtools, OutlineNode } from "../types";

/**
 * Treeview operations
 */
export default function konvaDevtoolsOutline(devtools: KonvaDevtools) {
  function buildTree(node: Konva.Container | Konva.Node): OutlineNode {
    const obj = toObject(node);

    if (node.hasChildren()) {
      obj.children = [];
      (node as Konva.Container)
        .getChildren()
        .forEach((child: Konva.Container) => {
          obj.children.push(buildTree(child));
        });
    }

    return obj;
  }

  // we create our own version of toObject based on toObject function from Konva
  // the purpose of this is to allows us add any custom fields as we want
  function toObject(node: Konva.Node): OutlineNode {
    // eslint-disable-next-line prefer-const
    let obj = {} as any,
      // eslint-disable-next-line prefer-const
      attrs = node.getAttrs(),
      key,
      val,
      getter,
      defaultValue,
      nonPlainObject;

    obj.attrs = {};

    for (key in attrs) {
      val = attrs[key];
      // if value is object and object is not plain
      // like class instance, we should skip it and to not include
      nonPlainObject =
        devtools.Konva().Util.isObject(val) &&
        !devtools.Konva().Util._isPlainObject(val) &&
        !devtools.Konva().Util._isArray(val);
      if (nonPlainObject) {
        continue;
      }
      getter = typeof this[key] === "function" && this[key];
      // remove attr value so that we can extract the default value from the getter
      delete attrs[key];
      defaultValue = getter ? getter.call(this) : null;
      // restore attr value
      attrs[key] = val;
      if (defaultValue !== val) {
        obj.attrs[key] = val;
      }
    }

    obj.className = node.getClassName();
    obj._id = node._id;
    obj.isShape = node instanceof devtools.Konva().Shape;
    return devtools.Konva().Util._prepareToStringify(obj);
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
    select(_id: number, stageIndex = 0, serialize = true) {
      const stage = devtools.Konva().stages[stageIndex];
      if (stage._id === _id) return serialize ? toObject(stage) : stage;
      const item = stage.findOne((n) => n._id === _id);
      if (item) return serialize ? toObject(item) : item;

      return undefined;
    },
    toObject,
  };
}
