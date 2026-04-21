# Architecture

This document explains how Konva Devtools works under the hood — the extension structure, the bridge pattern, and how each tab (Elements, Profiler, Animations) is implemented.

## Extension Structure

The extension is a Chrome MV3 extension built as a pnpm monorepo. Each piece runs in a different context:

| Piece | Path | Context | Role |
|---|---|---|---|
| **Background** | `chrome-extension/src/background/` | Service worker | Listens for Konva detection messages, swaps toolbar icon (grey → blue) |
| **Content script** | `pages/content/src/matches/all/` | Content script (every page) | Injects detector into the page, relays detection results to background |
| **Detector** | `pages/content/src/matches/detector/` | Page context (IIFE) | Checks `window.Konva` presence via DOM CustomEvents |
| **Devtools page** | `pages/devtools/src/` | DevTools context | Polls inspected page for Konva; creates the "Konva" panel when found |
| **Devtools panel** | `pages/devtools-panel/src/` | DevTools panel (sandboxed) | The main React UI — tree view, attribute editor, profiler, etc. |
| **Popup** | `pages/popup/src/` | Extension popup | Shows Konva detection status |

### Shared Packages (`packages/`)

| Package | Purpose |
|---|---|
| `@extension/env` | Build-time env flags (`IS_DEV`, `IS_FIREFOX`, etc.) |
| `@extension/storage` | `chrome.storage` wrapper with React hook |
| `@extension/shared` | Hooks (`useStorage`), HOCs (`withSuspense`, `withErrorBoundary`), utils |
| `@extension/ui` | Shared UI components (`LoadingSpinner`, `ToggleButton`, etc.) |
| `@extension/vite-config` | Shared Vite config for pages |
| `@extension/tailwindcss-config` | Shared Tailwind preset |
| `@extension/tsconfig` | Shared TS configs |

## The Bridge Pattern

The devtools panel **cannot** access the inspected page's JavaScript directly. Instead, all communication goes through `chrome.devtools.inspectedWindow.eval`, wrapped in a Promise-based `bridge` function:

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   DevTools Panel (React)    │         │   Inspected Page (Konva)     │
│                             │  eval   │                              │
│  bridge("hook.outline.      │ ──────> │  __KONVA_DEVTOOLS_GLOBAL_    │
│    trees()")                │         │    HOOK__.outline.trees()    │
│                             │ <────── │                              │
│  receives serialized result │  JSON   │  returns serializable data   │
└─────────────────────────────┘         └──────────────────────────────┘
```

**Key constraint**: `eval` can only pass strings and receive JSON-serializable results. Functions, class instances, and circular references cannot cross the bridge.

### Module Injection

On connect, `connect.ts` serializes six TypeScript modules via `.toString()` and evals them into the page as a single IIFE. Each module becomes a property on `window.__KONVA_DEVTOOLS_GLOBAL_HOOK__`:

```
connect.ts ──eval──> window.__KONVA_DEVTOOLS_GLOBAL_HOOK__ = {
                       Konva(),        // konvaDevtools.ts — resolve window.Konva
                       stage(i),       // konvaDevtools.ts — access Konva.stages[i]
                       outline: {...}, // konvaDevtoolsOutline.ts
                       selection: {...}, // konvaDevtoolsSelection.ts
                       overlay: {...}, // konvaDevtoolsOverlay.ts
                       profiler: {...}, // konvaDevtoolsProfiler.ts
                       animations: {...}, // konvaDevtoolsAnimations.ts
                     }
```

Because these modules are serialized via `.toString()`, they **cannot** import external packages or reference extension-side closures. They must be self-contained functions that only use browser globals and the Konva API.

### Polling Model

The panel uses polling (via `setInterval`) rather than push-based events:

| Data | Poll interval | Source |
|---|---|---|
| Scene graph tree | 500ms | `outline.trees()` |
| Selected node attributes | 500ms | `selection.getSelectedNode()` |
| Active (hovered) node | 500ms | `selection.getActiveNode()` |
| Scene statistics | 500ms | `outline.stats()` |
| Profiler data | 300ms | `profiler.getSummary()` + `profiler.getRecentRecords()` |
| Animations/Tweens | 500ms | `animations.getSummary()` |
| Event listeners | 500ms | `selection.getSelectedNodeEventInfo()` |
| Cache info | 500ms | `selection.getSelectedNodeCacheInfo()` |
| Change tracking diff | 600ms | `selection.getAttrDiff()` |

Each poll is a `bridge(eval_string)` call that round-trips through `chrome.devtools.inspectedWindow.eval`.

## Elements Tab

The Elements tab is the main view, split into a left tree panel and a right inspector panel.

### Scene Graph Tree

**Data flow:**

1. `konvaDevtoolsOutline.ts` walks `Konva.stages[]` recursively, building a tree of `OutlineNode` objects (className, _id, name, attrs, children).
2. The panel receives this tree every 500ms and flattens it into a `FlatNode[]` array via `flattenTree.ts`.
3. A virtualized list (`@tanstack/react-virtual`) renders only the visible rows (~30-40 at a time), enabling smooth scrolling even with 10k+ nodes.
4. Expand/collapse state is a single `Set<number>` of expanded node IDs, lifted to `Panel.tsx`.

**Search:** The search bar supports four modes, parsed by `searchUtils.ts`:
- Plain text → matches className or name (case-insensitive)
- `/regex/` → matches className or name by regex
- `attr:value` → matches a specific attribute value
- `#id` → matches a node by its Konva `_id`

Matching filters the flattened tree to show only matched nodes and their ancestors.

**Drag-and-drop reorder:** Each tree row is HTML5 draggable. Dropping a node "before", "after", or "inside" another node calls `selection.moveNode()` on the page side, which uses Konva's `add()` and `setZIndex()` to reparent or reorder.

### Inspector Panel (Right Side)

When a node is selected, the right panel shows:

**Attributes** (`Attributes.tsx`): Editable inputs for every attribute on the node. Special handling for:
- Color attributes → inline color picker swatch
- Number attributes → drag-to-scrub on the label (hold mouse and drag left/right)
- JSON attributes → textarea with syntax error handling

**Filters** (`Filters.tsx`): Lists Konva image filters applied to the node. Users can add/remove filters and edit filter-specific parameters. On Konva v10+, also supports native CSS filter strings.

**Event Listeners** (`EventListeners.tsx`): Polls `selection.getSelectedNodeEventInfo()` which reads the node's internal `eventListeners` map. Displays:
- All registered event types and handler counts
- Warnings if `listening: false` is set on the node or any parent (which blocks events)
- Whether the node has a custom `hitFunc`

**Cache Inspector** (`CacheInspector.tsx`): Shows whether the node is cached, its cached canvas dimensions, and estimated memory usage. Provides buttons to enable or clear cache via `node.cache()` / `node.clearCache()`.

**Change Tracking** (`NodeDiff.tsx`): Users can take an attribute "snapshot" of the selected node. The panel then polls for diffs — showing which attributes were added, removed, or changed since the snapshot, with color-coded indicators.

**Copy / Export**: Buttons to copy the node as a `new Konva.X({...})` constructor call or export it as JSON.

### Overlays

`konvaDevtoolsOverlay.ts` manages DOM overlays painted on top of the Konva canvas:

**Selection overlay**: A blue highlight box positioned over the hovered/selected node, updated via `requestAnimationFrame`. Uses `node.getClientRect()` + the stage container's `getBoundingClientRect()` to compute page-absolute positioning.

**Hit region visualization**: Creates a `div` overlay for every shape across all stages. Each shape is colored based on:
- Green: listening and has event handlers
- Blue: listening but no handlers
- Red: blocked (`listening: false` on the node or a parent)
- Orange: has a custom `hitFunc`

Updated continuously via `requestAnimationFrame`.

**Render heatmap**: Patches `Konva.Layer.prototype.draw` to count how many times each layer redraws. Overlays each layer's bounding box with a color from blue (few redraws) → red (many redraws), representing relative draw frequency.

### Scene Statistics

`konvaDevtoolsOutline.ts` has a `stats()` method that recursively traverses all nodes to collect:
- Total nodes, shapes, containers (groups), layers, stages
- Hidden node count (`visible: false`)
- Cached node count + estimated cache memory (width × height × 4 bytes per cached canvas)
- Konva version

Displayed in the `StatsBar` footer component.

## Profiler Tab

The Profiler measures `Layer.draw()` performance.

### How It Works

1. **Start recording**: `konvaDevtoolsProfiler.ts` monkey-patches `Konva.Layer.prototype.draw`:

   ```
   Original:  Layer.prototype.draw = function() { ... }
   Patched:   Layer.prototype.draw = function() {
                const start = performance.now();
                originalDraw.call(this);
                const elapsed = performance.now() - start;
                records.push({ layerId, drawTime: elapsed, ... });
              }
   ```

2. **During recording**: Every `draw()` call is timed and logged with the layer ID, layer name, draw time, timestamp, and node count.

3. **Stop recording**: The original `draw` method is restored.

### Data Displayed

The Profiler UI (`Profiler.tsx`) polls the page-side profiler every 300ms and shows:

- **Summary bar**: Total draws, total time, average draw time
- **Per-layer breakdown**: For each layer — draw count, average time, max time, total time, with horizontal bar charts
- **Recent draws table**: The last 50 individual draw events with timestamps and durations

### Limitations

- Profiling only captures `Layer.draw()` calls. It does not measure individual shape rendering.
- The profiler state (recording flag + records) lives in the page context. However, the React component unmounts when you switch tabs, so the polling stops. The recording continues in the background, but the UI won't update until you switch back.

## Animations Tab

The Animations tab provides a live view of all running Konva animations and tweens.

### How It Works

Unlike the Profiler (which patches methods), the Animation Tracker **reads Konva's internal static state** directly:

- **`Konva.Animation.animations`** — a static array that Konva maintains internally, containing all currently running `Animation` instances. Each entry has an `id`, `layers` array, and an `isRunning()` method.

- **`Konva.Tween.attrs`** — a static object Konva uses to track active tweens. Structured as `{ [nodeId]: { [tweenId]: { [attrName]: value } } }`.

This approach was chosen over Proxy-based constructor patching because bundlers like Vite resolve imports at build time, bypassing runtime patches on `window.Konva.Animation`.

### Stale Entry Filtering

When a stage is destroyed, Konva doesn't always clean up `Tween.attrs` or remove finished animations from the static array. The tracker filters these out:

- **Animations**: Each animation's layers are checked with `layer.getStage()`. If the stage is no longer in `Konva.stages`, the animation is excluded.
- **Tweens**: Each tween's `nodeId` is looked up across all active stages. If the node isn't found in any live stage, the tween is excluded.

### Data Displayed

The Animations UI (`AnimationTracker.tsx`) polls every 500ms and shows:

- **Running Animations**: Each animation with its ID, running status, and target layers
- **Active Tweens**: Each tween with its target node (class name + `_id`), tween ID, and the properties being animated (e.g., `scaleX`, `opacity`, `fill`)
- A green pulsing "Live" indicator when any animations or tweens are active

### Lifecycle

The component unmounts when you switch to another tab, stopping the polling. When you switch back, it remounts and starts fresh — since it reads live state, no data is lost.

## Export / Import

### Export

`selection.exportStageJSON(stageIndex)` calls `stage.toJSON()` which serializes the entire node tree and all attributes to JSON. The panel shows a dropdown to pick which stage to export.

### Import

`selection.importJSON(json, stageIndex)` handles two cases:
- **Stage JSON** (`className: "Stage"`): Cannot create a new Stage (requires a DOM container), so it imports the stage's children (layers) into the existing stage.
- **Other nodes**: Creates the node via `Konva.Node.create(json)` and adds it to the selected container or the first layer.

### What's NOT preserved

Animations, tweens, event listeners, and custom functions are runtime JavaScript and cannot be serialized to JSON. Export/import captures a **static snapshot** of the visual state only.

## Transform Gizmo

The transform gizmo allows users to interactively resize, rotate, and move the selected Konva node directly on the canvas.

### Implementation

Rather than building custom DOM-based handles (which require reimplementing complex transform math for rotation, skew, and per-shape quirks), the gizmo uses Konva's native `Konva.Transformer` component:

1. **Toggle on**: `konvaDevtoolsOverlay.ts` creates a `new Konva.Transformer()` and adds it to the selected node's layer.
2. **Sync**: A 300ms polling loop checks whether the transformer is attached to the correct node. If the selection changes, it detaches from the old node and attaches to the new one. If the node's layer changes, it moves the transformer to the new layer.
3. **Toggle off**: The transformer is detached from its node, removed from the layer, and destroyed.

### Why Konva.Transformer

An earlier implementation used DOM `div` elements as resize/rotate handles, positioned with CSS `transform`. This approach broke down for:
- Nodes with non-zero rotation (handle cursors didn't follow the rotation)
- Line and Arrow shapes (no meaningful bounding box corners)
- Cumulative transform chains (nested group rotations + node rotation)

`Konva.Transformer` handles all of these natively since it operates within Konva's own coordinate system.

## Keyboard Shortcuts

`Panel.tsx` registers a global `keydown` listener with the following bindings:

| Key | Action |
|---|---|
| Arrow Up / Down | Navigate to previous / next row in the tree |
| Arrow Right | Expand selected node |
| Arrow Left | Collapse selected node |
| Enter | Select hovered node |
| Escape | Deselect current node |
| Delete / Backspace | Destroy selected node on the page |
| H | Toggle `visible` attribute |
| L | Toggle `listening` attribute |
| Cmd/Ctrl + F | Focus search input |

Shortcuts are ignored when focus is inside an input, textarea, or select element.

## Bookmark / Pin Nodes

Users can pin frequently inspected nodes for quick access. Pinned node IDs are stored in `chrome.storage.local` under `konva_pinned_ids` and persist across sessions.

In the tree view, each row (`Element.tsx`) shows a pin icon on hover. Pinned nodes are highlighted with a filled pin indicator. The `Panel.tsx` component filters `flatRows` to produce a `pinnedRows` array that appears at the top of the tree view.

## Screenshot Tools

Two screenshot capabilities are provided:

1. **Screenshot stage** (toolbar button in `Panel.tsx`): Calls `stage.toDataURL({ pixelRatio: 2 })` on the selected stage and opens the resulting data URL in a new tab.
2. **Screenshot selected node** (button in `InspectedElement.tsx`): Calls `selectedNode.toDataURL({ pixelRatio: 2 })` for the currently inspected node.

Both use Konva's built-in `toDataURL` which renders the canvas content at the specified pixel ratio.

## Accessibility Insights

The Accessibility Insights feature (`AccessibilityInsights.tsx`) flags common issues on interactive Konva nodes.

### Checks Performed

`konvaDevtoolsSelection.ts` exposes `getAccessibilityInfo()` which inspects the selected node for:

| Check | Severity | Condition |
|---|---|---|
| No name or ID | error | Node has event listeners but no `name()` and no `id()` |
| Tiny hit area | warning | Interactive node's bounding rect is smaller than 24×24px |
| Listening disabled on parent | error | Node has listeners but an ancestor has `listening: false` |
| Self listening disabled | warning | Node has listeners and its own `listening()` is `false` |
| Very low opacity | warning | Interactive node with opacity < 0.1 |
| Hidden | warning | Interactive node with `visible: false` |

### UI

The `AccessibilityInsights` component appears as a collapsible section in the inspector panel. It shows:
- A summary badge with issue count and worst severity (error/warning/ok)
- Individual issues listed with severity icons and descriptions
