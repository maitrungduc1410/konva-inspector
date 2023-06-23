import type Konva from "konva";
import { KonvaDevtools, OutlineNode } from "../types";

export default function konvaDevtoolsSelection(devtools: KonvaDevtools) {
  let activeNode: Konva.Container;
  let activeNodeStageIndex: number | null;
  let selectedNode: Konva.Container;
  let alwaysInspect = false;

  // memoize handler so that we can remove it later
  let handlers = {};

  return {
    active(serialize = false): Konva.Node | OutlineNode | undefined {
      if (!activeNode) return undefined;
      return serialize ? devtools.outline.toObject(activeNode) : activeNode;
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
      activeNodeStageIndex = stageIndex;

      // we need to clear before connect to make sure it works in case of multi stages
      devtools.overlay.clear();
      devtools.overlay.connect(stageIndex);
    },
    deactivate() {
      activeNode = undefined;
      activeNodeStageIndex = null;
      handlers = {};
      devtools.overlay.clear();
    },
    updateAttrs(attrs: Record<string, string | number | boolean>) {
      const { image, ...rest } = attrs;
      if (image) {
        (() => {
          const newImg = new Image();
          newImg.onload = () => {
            (devtools.selection.selected() as Konva.Image).image(newImg);
          };
          newImg.src = image as string;
        })();
      } else {
        selectedNode.setAttrs(rest);
      }
    },
    registerMouseOverEvents() {
      // we check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      if (devtools.Konva()) {
        for (const [index, stage] of devtools.Konva().stages.entries()) {
          stage.content.addEventListener(
            "mouseleave",
            devtools.selection.deactivateOnMouseLeaveWhenAlwaysInspect
          );
          stage.on(
            "mouseover",
            devtools.selection.selectShapeAtCursor(stage, index)
          );
          stage.on("click", devtools.selection.unregisterMouseOverEvents);
        }
        1; // add this line so that it'll be returned when evaluation, otherwise it'll throw error because the evaluation returns object class
      }
    },
    unregisterMouseOverEvents() {
      // we check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
      if (devtools.Konva()) {
        for (const [index, stage] of devtools.Konva().stages.entries()) {
          stage.content.removeEventListener(
            "mouseleave",
            devtools.selection.deactivateOnMouseLeaveWhenAlwaysInspect
          );
          stage.off(
            "mouseover",
            devtools.selection.selectShapeAtCursor(stage, index)
          );
          stage.off("click", devtools.selection.unregisterMouseOverEvents);
        }
        if (activeNode) {
          devtools.selection.select(activeNode._id, activeNodeStageIndex);
        }
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
  };
}
