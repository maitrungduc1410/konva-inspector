import { Root, createRoot } from "react-dom/client";
import "@pages/panel/index.css";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
import connect from "./devtools/connect";
import Panel from "./components/Panel";

refreshOnUpdate("pages/panel");

const bridge: BridgeFn = (code: string) => {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (result, err) => {
      if (err) {
        if (err instanceof Error) {
          reject(err);
        }
        console.log(code);
        reject(new Error(err.value || err.description || err.code));
      }
      resolve(result as any);
    });
  });
};

let root: Root;
function init() {
  connect(bridge);

  if (root) return;
  const appContainer = document.getElementById("app") as HTMLDivElement;
  if (!appContainer) {
    throw new Error("Can not find #app");
  }
  root = createRoot(appContainer);
  root.render(<Panel />);
  appContainer.addEventListener("mouseleave", () => {
    bridge(
      "window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()"
    );
  });

  chrome.windows.onFocusChanged.addListener(() => {
    bridge(
      "window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()"
    );
  });
}

init();

export type BridgeFn = <T>(code: string) => Promise<T>;

export { bridge };
