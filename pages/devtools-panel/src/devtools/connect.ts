import type { BridgeFn } from '..';
import konvaDevtools from './konvaDevtools';
import konvaDevtoolsOutline from './konvaDevtoolsOutline';
import konvaDevtoolsOverlay from './konvaDevtoolsOverlay';
import konvaDevtoolsSelection from './konvaDevtoolsSelection';

export default function connect(bridge: BridgeFn) {
  bridge(`(() => {
    window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ = (${konvaDevtools.toString()}());
    window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.outline = (${konvaDevtoolsOutline.toString()}(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__));
    window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection = (${konvaDevtoolsSelection.toString()}(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__));
    window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay = (${konvaDevtoolsOverlay.toString()}(window.__KONVA_DEVTOOLS_GLOBAL_HOOK__));
  })();`);
}
