import type Konva from "konva";
import { KonvaDevtools, OutlineNode } from "../types";

export default function konvaDevtoolsSelection(devtools: KonvaDevtools) {
  let activeNode: Konva.Container;
  let selectedNode: Konva.Container;

  return {
    active(): Konva.Node | undefined {
      return activeNode;
    },
    selected(serialize = false): Konva.Node | OutlineNode | undefined {
      if (!selectedNode) return undefined;
      return serialize ? devtools.outline.toObject(selectedNode) : selectedNode;
    },
    select(_id: number, stageIndex = 0): OutlineNode {
      const n = devtools.outline.select(
        _id,
        stageIndex,
        false
      ) as Konva.Container;
      selectedNode = n;
      return devtools.outline.toObject(activeNode);
    },
    activate(_id: number, stageIndex = 0) {
      const n = devtools.outline.select(
        _id,
        stageIndex,
        false
      ) as Konva.Container;
      activeNode = n;

      devtools.overlay.connect(stageIndex);
    },
    deactivate() {
      activeNode = undefined;
      devtools.overlay.clear();
    },
    updateAttrs(attrs: any) {
      selectedNode.setAttrs(attrs);
    },
    selectShapeAtCursor() {
      const stage = devtools.Konva().stages[0];
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const node = stage.getIntersection(pointerPosition);
        if (node) {
          devtools.selection.activate(node._id);
        } else {
          devtools.selection.deactivate();
        }
      }
    },
  };
}
