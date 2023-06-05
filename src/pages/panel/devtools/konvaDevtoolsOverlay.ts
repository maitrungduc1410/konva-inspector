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
    overlayEl.style.zIndex = "99999999999";
    overlayEl.style.fontFamily =
      "SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace";
    Object.assign(overlayEl.style, {
      ...position("0", "0", "0", "0"),
      pointerEvents: "none",
      transformOrigin: "top left",
    });

    const tooltip = document.createElement("div");
    tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    tooltip.style.position = "absolute";
    tooltip.style.top = "-35px";
    tooltip.style.left = "0";
    tooltip.style.display = "flex";
    tooltip.style.gap = "5px";
    tooltip.style.color = "white";
    tooltip.style.padding = "4px 8px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.width = "max-content";

    const leftTooltip = document.createElement("div");
    leftTooltip.style.color = "#61dafb";

    const separator = document.createElement("div");
    separator.textContent = "|";

    const rightTooltip = document.createElement("div");

    tooltip.append(leftTooltip);
    tooltip.append(separator);
    tooltip.append(rightTooltip);
    overlayEl.appendChild(tooltip);
    document.body.appendChild(overlayEl);

    function calibrateOverlay() {
      const content = devtools.content(stageIndex);
      const contentBounds = content.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      overlayEl.style.transform = `translate(${contentBounds.x + scrollX}px, ${
        contentBounds.y + scrollY
      }px)`;
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

      leftTooltip.textContent = node.getClassName();
      rightTooltip.textContent = `${rect.width.toFixed(
        2
      )}px x ${rect.height.toFixed(2)}px (${rect.x.toFixed(
        2
      )}, ${rect.y.toFixed(2)})`;

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
