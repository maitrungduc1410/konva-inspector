<div align="center">
<img src="./images/icon128.png" alt="logo"/>
<h1>Konva Devtools</h1>
<div>
<a href="https://chrome.google.com/webstore/detail/konvajs-devtools/aleknfecbpmpnkfoaohgpffcjenmjjfi">Chrome Extension</a>
&#x2022;
<a href="https://addons.mozilla.org/vi/firefox/addon/konvajs-devtools">Firefox Addon</a>
&#x2022;
<a href="https://microsoftedge.microsoft.com/addons/detail/konvajs-devtools/noiamlkeehkigdfegcnnfanplidpmeaa">Edge Addon</a>
</div>

<div>
  <img style="width: 40%;" src="images/screenshots/2400x1800/1.png" />
  <img style="width: 40%;" src="images/screenshots/2400x1800/2.png" />
  <img style="width: 40%;" src="images/screenshots/2400x1800/3.png" />
  <img style="width: 40%;" src="images/screenshots/2400x1800/4.png" />
  <img style="width: 40%;" src="images/screenshots/2400x1800/5.png" />
</div>

</div>

# Features
- [x] Support all Konva objects (Text, Image, Rect, Star, Group, Stage, Layer,....)
- [x] Edit object attributes in place, right in the extension
- [x] Changing Filter is supported
- [x] Select object by Cursor
- [x] Dark theme supported
- [x] Multiple stages supported
# Develop
To Develop the extension:
- First clone the project
- Run `pnpm install`
- Run `pnpm dev` (for Chrome/Edge) or `pnpm dev:firefox` for Firefox

After that, a `dist` folder will be generated, next based on your browser do the following
- Chrome: open `chrome://extensions/` and drag `dist` folder there
- Edge: open `edge://extensions/` and drag `dist` folder there
- Firefox: open `about:debugging#/runtime/this-firefox` > Load Temporary Add-on > Select any file in the `dist` folder

> Note: for Firefox, to make background script + popup page work on load, right click the Konva extension icon on browser bar -> select "Always allow....""

# Build
To build project for publish, run `pnpm build` (for Chrome/Edge) or `pnpm build:firefox` for Firefox

# Architecture
## Overview

| Module            | File                                                       | Description                                                                                                                                                                                                                                                                                                                                             | Screenshot                                                              |
|-------------------|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| background_script | [chrome-extension/src/background/index.ts](chrome-extension/src/background/index.ts) | Background script runs in background, used to receive detection result from content_script, and update extension icon from black to blue (if Konva is found)                                                                                                                                                                                            | ![ alt text ]( images/extension_icon_bg_script.png   "Extension_icon" ) |
| content_script    | [pages/content/src/matches/all/index.ts](pages/content/src/matches/all/index.ts)       | Content script runs on host page loaded, it has an interval to detect Konva by injecting `detector.iife.js` to the host page (because content_script doesn't shared same JS runtime with host page) then push message background script to update extension icon. It also receives message for detection request from popup page to detect Konva immediately |                                                                         |
| detector    | [pages/content/src/matches/detector/index.ts](pages/content/src/matches/detector/index.ts)       | Detector script will run on host page to detect if Konva is installed, this script shares same JS context with host page |                                                                         |
| devtools          | [pages/devtools/src/index.ts](pages/devtools/src/index.ts)     | Devtools page, which will spawn `panel` for devtools UI. It has an `interval` to keep on detecting Konva from host page until found, and only add `panel` if Konva is found                                                                                                                                                                             |                                                                         |
| panel             | [pages/devtools-panel/src/index.tsx](pages/devtools-panel/src/index.tsx)         | React UI for the devtool, details see below                                                                                                                                                                                                                                                                                                             | ![ alt text ]( images/screenshots/2400x1800/1.png   "Title" )           |
| popup             | [pages/popup/src/index.tsx](pages/popup/src/index.tsx)         | React UI for popup page, on click the icon to open the popup page, we send a message to content_script to request detect immediately                                                                                                                                                                                                                    | ![ alt text ]( images/popup_page.png   "Popup page" )                   |

## Panel architecture
Panel is just a normal React app that renders detected Konva element tree except it has 2 extra parts:
- [devtools](pages/devtools-panel/src/devtools/connect.ts): global variables that will be injected to host page at runtime
- [bridge function](pages/devtools-panel/src/index.tsx): a function to execute JS code at host page, it's just a wrapper of `chrome.devtools.inspectedWindow.eval` that returns a Promise


The `devtools` will inject the follow global variables to host page:
- root `__KONVA_DEVTOOLS_GLOBAL_HOOK__`: has some common functions `Konva(), content(), stage()`
- `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.outline`: helper functions to get Konva object tree
- `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.selection` helper functions to select/highlight/active/update attributes for Konva object
- `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__.overlay`: function to render a blue highlight box on top of Konva object when highlighting

The `devtools` has a root method `connect` that will convert all the above variables/functions to string then use `bridge` to execute it on the host page

> Note that the `bridge` uses `chrome.devtools.inspectedWindow.eval` requires result of the evaluation expression to be serializable so if it returns something like an instance of a Class then it'll throw error
# Thanks
- [pixi-inspector](https://github.com/bfanger/pixi-inspector): which gives me very great idea on how to structure my code
- [react devtools](https://github.com/facebook/react/tree/main/packages/react-devtools): My extension UI is inspired by this
- [chrome-extension-boilerplate-react-vite
](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite): Boiler template project to create Chrome extension

