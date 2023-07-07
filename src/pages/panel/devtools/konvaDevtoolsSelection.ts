import type Konva from "konva";
import { Filter, KonvaDevtools, OutlineNode } from "../types";
import { IAttr } from "../components/constants";

export default function konvaDevtoolsSelection(devtools: KonvaDevtools) {
  let activeNode: Konva.Container;
  let activeNodeStageIndex: number | null;
  let selectedNode: Konva.Container;
  let alwaysInspect = false;

  // memoize handler so that we can remove it later
  // note: do not clear handlers after unregisterMouseOverEvents, otherwise we'll lost reference to remove and the toggle button from React won't work anymore
  const handlers = {};

  const FILTER_RENDERERS: Array<{ name: string; values: IAttr[] }> = [
    {
      name: "Blur",
      values: [{ name: "blurRadius", type: "number", min: 0 }],
    },
    {
      name: "Brighten",
      values: [
        { name: "brightness", type: "number", min: -1, max: 1, step: 0.05 },
      ],
    },
    {
      name: "Contrast",
      values: [{ name: "contrast", type: "number", min: -100, max: 100 }],
    },
    {
      name: "Emboss",
      values: [
        { name: "embossStrength", type: "number", min: 0, max: 1, step: 0.1 },
        { name: "embossWhiteLevel", type: "number", min: 0, max: 1, step: 0.1 },
        {
          name: "embossDirection",
          type: "select",
          options: [
            { value: "top", label: "Top" },
            { value: "top-left", label: "Top Left" },
            { value: "top-right", label: "Top Right" },
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "bottom", label: "Bottom" },
            { value: "bottom-left", label: "Bottom Left" },
            { value: "bottom-right", label: "Bottom Right" },
          ],
        },
        {
          name: "embossBlend",
          type: "boolean",
          defaultValue: false,
        },
      ],
    },
    {
      name: "Enhance",
      values: [
        { name: "enhance", type: "number", min: -1, max: 1, step: 0.01 },
      ],
    },
    {
      name: "Grayscale",
      values: null,
    },
    {
      name: "HSL",
      values: [
        { name: "hue", type: "number", min: 0, max: 259 },
        { name: "saturation", type: "number", min: -2, max: 10, step: 0.5 },
        { name: "luminance", type: "number", min: -2, max: 2, step: 0.1 },
      ],
    },
    {
      name: "HSV",
      values: [
        { name: "hue", type: "number", min: 0, max: 259 },
        { name: "saturation", type: "number", min: -2, max: 10, step: 0.5 },
        { name: "value", type: "number", min: -2, max: 2, step: 0.1 },
      ],
    },
    {
      name: "Invert",
      values: null,
    },
    {
      name: "Kaleidoscope",
      values: [
        { name: "kaleidoscopePower", type: "number", min: 0 },
        { name: "kaleidoscopeAngle", type: "number", min: 0 },
      ],
    },
    {
      name: "Mask",
      values: [{ name: "threshold", type: "number", min: 0 }],
    },
    {
      name: "Noise",
      values: [{ name: "noise", type: "number", min: 0, step: 0.1 }],
    },
    {
      name: "Pixelate",
      values: [{ name: "pixelSize", type: "number", min: 1 }],
    },
    {
      name: "Posterize",
      values: [{ name: "levels", type: "number", min: 0, max: 1, step: 0.01 }],
    },
    {
      name: "RGB",
      values: [
        { name: "red", type: "number", min: 0, max: 256 },
        { name: "green", type: "number", min: 0, max: 256 },
        { name: "blue", type: "number", min: 0, max: 256 },
      ],
    },
    {
      name: "RGBA",
      values: [
        { name: "red", type: "number", min: 0, max: 256 },
        { name: "green", type: "number", min: 0, max: 256 },
        { name: "blue", type: "number", min: 0, max: 256 },
        { name: "alpha", type: "number", min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      name: "Sepia",
      values: null,
    },
    {
      name: "Solarize",
      values: null,
    },
    {
      name: "Threshold",
      values: [
        { name: "threshold", type: "number", min: 0, max: 1, step: 0.01 },
      ],
    },
  ];

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
      if (!activeNode) {
        return;
      }
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
      // always check this to make sure Konva is still presented in host page
      if (!devtools.Konva()) {
        return;
      }
      // we check for window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.Konva() is undefined or not to prevent the case when we reload at that time Konva is not initialized yet
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
    getSelectedNodeFilters() {
      // always check this to make sure Konva is still presented in host page
      if (!devtools.Konva()) {
        return [];
      }
      const hostPageFilters = devtools.Konva().Filters;
      return (
        selectedNode.filters()?.map((item) => {
          // because in different versions of Konva, the function name may be diff, like "Blur -> Blur2"
          const filter = Object.keys(hostPageFilters).find(
            (key) => item === hostPageFilters[key]
          );
          const renderer = FILTER_RENDERERS.find((i) => i.name === filter);

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
        }) || []
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
  };
}
