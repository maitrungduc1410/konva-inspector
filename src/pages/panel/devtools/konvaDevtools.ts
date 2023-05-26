import type TKonva from "konva";
import { OutlineNode } from "../types";

export default function konvaDevtools() {
  const win = window as any;

  function getGlobal(varname: string) {
    if (win[varname]) {
      return win[varname];
    }
    if (win.frames) {
      for (let i = 0; i < win.frames.length; i += 1) {
        try {
          if (win.frames[i][varname]) {
            return win.frames[i][varname];
          }
        } catch (_) {
          // access to iframe was denied
        }
      }
    }
    return undefined;
  }

  function getRenderedBy(node: TKonva.Node) {
    const trees: string[] = [];

    const parent = node.getParent();
    if (parent) {
      trees.push(node.getParent().getClassName());
      const result = getRenderedBy(parent);
      trees.push(result);
    }

    return trees;
  }

  function Konva(): typeof TKonva {
    return getGlobal("Konva");
  }

  return {
    Konva,
    content(stageIndex = 0) {
      return Konva().stages[stageIndex].getContent();
    },
    renderedBy(node: TKonva.Node) {
      return getRenderedBy(node);
    },
  };
}
