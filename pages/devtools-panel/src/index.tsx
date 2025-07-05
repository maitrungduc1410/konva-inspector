import '@src/index.css';
import Panel from '@src/Panel';
import { createRoot } from 'react-dom/client';
import connect from './devtools/connect';

const bridge: BridgeFn = (code: string) =>
  new Promise((resolve, reject) => {
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

const init = () => {
  connect(bridge);

  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(<Panel />);

  // TODO: find a solution for firefox
  // chrome.windows is not available on firefox
  chrome.windows?.onFocusChanged.addListener(() => {
    bridge('window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ && window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection.deactivate()');
  });
};

init();

export type BridgeFn = <T>(code: string) => Promise<T>;

export { bridge };
