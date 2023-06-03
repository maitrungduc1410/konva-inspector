import type Konva from "konva";
import { KonvaDevtools } from "../types";

export default function konvaDevtoolsOverlay(devtools: KonvaDevtools) {
  function position(
    x: string,
    y: string,
    width: string,
    height: string
  ): Partial<CSSStyleDeclaration> {
    return {
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
    };
  }

  let overlayEl: HTMLDivElement | undefined;
  let raf: number | undefined;
  function connect(stageIndex = 0) {
    if (overlayEl) return;

    overlayEl = document.createElement("div");
    overlayEl.style.backgroundColor = "rgba(0, 161, 255, 0.3)";
    Object.assign(overlayEl.style, {
      ...position("0", "0", "0", "0"),
      pointerEvents: "none",
      transformOrigin: "top left",
    });

    document.body.appendChild(overlayEl);
    function calibrateOverlay() {
      const content = devtools.content(stageIndex);
      const contentBounds = content.getBoundingClientRect();
      const stage = devtools.stage(stageIndex);
      overlayEl.style.transform = `translate(${
        contentBounds.x + stage.x()
      }px, ${contentBounds.y + stage.y()}px)`;
    }

    let throttle = 0;

    function updateHighlight() {
      raf = requestAnimationFrame(updateHighlight);
      const node = devtools.selection.active() as Konva.Node;
      if (!node) return;
      const rect = node.getClientRect();
      overlayEl.style.top = rect.y.toString() + "px";
      overlayEl.style.left = rect.x.toString() + "px";
      overlayEl.style.width = rect.width.toString() + "px";
      overlayEl.style.height = rect.height.toString() + "px";

      if (throttle <= 0) {
        calibrateOverlay();
        throttle = 15;
      } else {
        throttle -= 1;
      }
    }

    updateHighlight();
  }

  return {
    connect,
    clear() {
      overlayEl && overlayEl.remove();
      overlayEl = undefined;
      raf && cancelAnimationFrame(raf);
      raf = undefined;
    },
  };
}
