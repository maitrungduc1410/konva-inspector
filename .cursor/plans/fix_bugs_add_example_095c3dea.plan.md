---
name: Fix Bugs Add Example
overview: Fix all 7 identified bugs in the Konva devtools extension, then add a local example Konva app for development testing.
todos:
  - id: bug-1-bridge
    content: Fix bridge function control flow in pages/devtools-panel/src/index.tsx
    status: completed
  - id: bug-2-this-context
    content: Fix `this` -> `node` in toObject in pages/devtools-panel/src/devtools/konvaDevtoolsOutline.ts
    status: completed
  - id: bug-3-wrong-return
    content: Fix select() returning wrong node in konvaDevtoolsSelection.ts line 172
    status: completed
  - id: bug-4-null-deref
    content: Fix null dereference in getSelectedNodeFilters in konvaDevtoolsSelection.ts
    status: completed
  - id: bug-5-json-parse
    content: Add try-catch around JSON.parse in Attributes.tsx line 142
    status: completed
  - id: bug-6-detection-stops
    content: Fix devtools detection stopping on transient errors in pages/devtools/src/index.ts
    status: completed
  - id: bug-7-popup
    content: Fix variable naming and add lastError check in Popup.tsx
    status: completed
  - id: example-workspace
    content: Add examples/* to pnpm-workspace.yaml
    status: completed
  - id: example-app
    content: Create examples/konva-app with Vite + Konva and a rich set of test shapes/filters
    status: completed
isProject: false
---

# Fix All Bugs and Add Example Project

## Part 1: Bug Fixes

### Bug 1 -- Bridge function broken control flow

**File**: [pages/devtools-panel/src/index.tsx](pages/devtools-panel/src/index.tsx) (lines 6-18)

**Problem**: The `eval` callback can `reject` twice (line 11 then line 14 when `err instanceof Error`), and `resolve` on line 16 runs unconditionally even after a rejection.

**Fix**: Add `return` after the first `reject`, and move `resolve` into an `else` branch:

```typescript
const bridge: BridgeFn = (code: string) =>
  new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (result, err) => {
      if (err) {
        if (err instanceof Error) {
          return reject(err);
        }
        console.log(code);
        return reject(new Error(err.value || err.description || err.code));
      }
      resolve(result as any);
    });
  });
```

---

### Bug 2 -- `this` context in `toObject`

**File**: [pages/devtools-panel/src/devtools/konvaDevtoolsOutline.ts](pages/devtools-panel/src/devtools/konvaDevtoolsOutline.ts) (lines 54-57)

**Problem**: `toObject(node)` is a standalone function, but references `this[key]` and `this` from Konva's original method where `this` was the node instance. Here `this` is the enclosing scope, so default-value detection is silently broken.

**Fix**: Replace `this` with `node`:

```typescript
getter = typeof node[key] === 'function' && node[key];
delete attrs[key];
defaultValue = getter ? getter.call(node) : null;
```

---

### Bug 3 -- `select()` returns the wrong node

**File**: [pages/devtools-panel/src/devtools/konvaDevtoolsSelection.ts](pages/devtools-panel/src/devtools/konvaDevtoolsSelection.ts) (line 172)

**Problem**: `select(_id, ...)` stores the found node as `selectedNode = n`, but returns `devtools.outline.toObject(activeNode)` instead of the just-selected node. The React UI then shows stale data.

**Fix**: Change line 172 to return the correct node:

```typescript
return devtools.outline.toObject(n);
```

---

### Bug 4 -- Null dereference in `getSelectedNodeFilters`

**File**: [pages/devtools-panel/src/devtools/konvaDevtoolsSelection.ts](pages/devtools-panel/src/devtools/konvaDevtoolsSelection.ts) (lines 269-274)

**Problem**: `FILTER_RENDERERS.find(...)` returns `undefined` for custom or unrecognized filters, then `renderer.name` throws.

**Fix**: Add a null guard, skip unknown filters:

```typescript
const renderer = FILTER_RENDERERS.find(i => i.name === filter);
if (!renderer) return null;
// ...rest of map body...
```

Then filter out nulls from the result: `.map(...).filter(Boolean)`.

---

### Bug 5 -- `JSON.parse` without try-catch in attribute editor

**File**: [pages/devtools-panel/src/components/Attributes.tsx](pages/devtools-panel/src/components/Attributes.tsx) (line 142)

**Problem**: The JSON textarea calls `JSON.parse(e.target.value)` on every keystroke. Typing partial JSON (e.g. `[1,`) throws immediately and breaks the component.

**Fix**: Wrap in try-catch; only call `updateAttr` when parsing succeeds:

```typescript
onChange={e => {
  try {
    updateAttr(item.name, JSON.parse(e.target.value));
  } catch {
    // ignore invalid JSON while the user is still typing
  }
}}
```

---

### Bug 6 -- Devtools detection permanently stops on transient eval errors

**File**: [pages/devtools/src/index.ts](pages/devtools/src/index.ts) (lines 11-14)

**Problem**: Any `eval` error (including transient errors during page navigation) calls `clearInterval`, killing detection forever. The user must close and reopen DevTools.

**Fix**: Only clear the interval on successful Konva detection, not on eval errors. Log errors but keep polling:

```typescript
(result, err) => {
  if (err) {
    console.log(err);
    // don't stop polling -- transient errors are expected during navigation
  } else if (result) {
    clearInterval(detectFromDevtoolInterval);
    chrome.devtools.panels.create('Konva', '/icon38.png', '/devtools-panel/index.html');
  }
},
```

Keep the outer `try/catch` with `clearInterval` for sync exceptions (those indicate real failures like extension context invalidation).

---

### Bug 7 -- Popup: misleading variable name + missing `lastError` check

**File**: [pages/popup/src/Popup.tsx](pages/popup/src/Popup.tsx) (lines 9, 14)

**Problem**:
- `setInterval` result stored in variable named `timeout` (misleading)
- `sendMessage` callback doesn't check `chrome.runtime.lastError`, causing console errors on restricted tabs and leaving UI stuck on "Looking for Konva..."

**Fix**:
- Rename `timeout` to `interval`
- Add `chrome.runtime.lastError` check in the callback:

```typescript
const interval = setInterval(detect, 3000);

// inside detect():
chrome.tabs.sendMessage(tabs[0].id, { type: '__KONVA_DEVTOOLS__REQUEST_DETECTION' }, function (response) {
  if (chrome.runtime.lastError) {
    return;
  }
  setIsKonva(response);
  if (response) {
    clearInterval(interval);
  }
});
```

---

## Part 2: Example Konva App

### Location and Setup

Create `examples/konva-app/` as a new workspace package. Add `examples/*` to [pnpm-workspace.yaml](pnpm-workspace.yaml).

### Files to create

- **`examples/konva-app/package.json`** -- Vite + TypeScript + Konva dependency, with `dev` script
- **`examples/konva-app/index.html`** -- HTML entry with a `#container` div
- **`examples/konva-app/src/main.ts`** -- Creates a Konva stage with a rich set of nodes for testing all inspector features:
  - A `Stage` with 2 `Layer`s (to test multi-layer)
  - Basic shapes: `Rect`, `Circle`, `Ellipse`, `Star`, `Ring`, `Wedge`
  - `Text` and `Line`/`Arrow`
  - A `Group` with nested children
  - An `Image` node (loaded from a URL or data URI)
  - A shape with a `Blur` filter applied (to test filter panel)
  - A `Transformer` attached to a shape (to test transformer attrs)
  - Each shape gets a `name` attribute so the tree view is descriptive
- **`examples/konva-app/tsconfig.json`** -- Extends shared tsconfig
- **`examples/konva-app/vite.config.ts`** -- Minimal Vite config

### Development Workflow

After creating the example, the developer can:

```bash
pnpm --filter @example/konva-app dev    # starts Vite dev server on localhost
pnpm dev                                 # starts extension build in parallel
```

Then load `dist/` in Chrome and open the example app page to test the inspector.
