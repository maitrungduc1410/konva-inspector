import { KonvaDevtools } from "../types";

export default function konvaDevtoolsViewport(devtools: KonvaDevtools) {
  return {
    size(stageIndex = 0) {
      const stage = devtools.Konva().stages[stageIndex];
      if (stage) {
        return {
          width: stage.width(),
          height: stage.height(),
        };
      }
      return undefined;
    },
    scale(stageIndex = 0) {
      const stage = devtools.Konva().stages[stageIndex];
      if (stage) {
        return stage.scale();
      }
      return undefined;
    },
  };
}
