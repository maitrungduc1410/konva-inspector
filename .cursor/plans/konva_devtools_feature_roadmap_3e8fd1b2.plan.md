---
name: Konva DevTools Feature Roadmap
overview: A prioritized feature roadmap for the Konva DevTools browser extension, organized by impact and effort, drawing from competitor analysis (PixiJS DevTools, React DevTools) and common Konva developer pain points.
todos:
  - id: discuss-priorities
    content: Discuss feature priorities with user and narrow down scope for first implementation batch
    status: completed
isProject: false
---

# Konva DevTools Feature Roadmap

## Current State

The extension currently provides: multi-stage tree view (virtualized), node attribute editing, canvas overlay on hover, "always inspect" mode, filter management (Konva + CSS native), basic tree search (prefix match on className), log-to-console, parent chain ("rendered by"), and light/dark theme.

## Tier 1 -- High Impact, Core Developer Needs

### 1. Console Variable (`$konva`) -- DONE

Expose the selected node as `$konva` in the browser console (like React's `$r` or Pixi's `$pixi`). This is the single most requested feature in canvas devtools -- developers need to quickly run methods, test transformations, or inspect properties not shown in the panel.

- On selection change, eval `$konva = stage.findOne(n => n._id === selectedId)` in page context
- Show a hint in the panel: "== $konva" next to the selected node badge

### 2. Event Listener Inspector -- DONE

New panel section showing all event listeners bound to the selected node. One of the top debugging pain points in Konva is "why isn't my click handler firing?"

- Read `node.eventListeners` (Konva stores them internally)
- Display event name, count of handlers, and whether the node has `listening: false` or `hitGraphEnabled: false`
- Warn if a parent has `listening: false` (which blocks child events)
- Show `hitStrokeWidth`, `hitFunc` presence, and `perfectDrawEnabled` status

### 3. Performance Profiler -- DONE

A new tab/mode that measures canvas rendering performance, inspired by React DevTools Profiler.

- **Render timing**: Hook into `Konva.Layer.prototype.draw` to measure per-layer draw time
- **Node count dashboard**: Total nodes, per-layer count, hidden nodes, shapes vs containers
- **Highlight slow layers**: Color-code layers by draw duration (green/yellow/red)
- **Redraw frequency**: Track how often each layer redraws and what triggers it
- **Flame chart**: Show draw call hierarchy and time distribution

### 4. Cache Inspector -- DONE

Caching is Konva's primary performance optimization, but developers struggle to understand what's cached and how much memory it uses.

- Show which nodes have `.cache()` applied (badge in tree + section in inspector)
- Display cache canvas dimensions and estimated memory (width * height * 4 bytes)
- Total cache memory across all cached nodes
- Warn about oversized caches or cached nodes that change frequently
- Button to visually highlight all cached nodes on canvas

### 5. Hit Region Visualization -- DONE

Toggle an overlay that shows hit detection regions vs visible regions. This addresses "why can't I click this node?"

- Render each node's hit region with a semi-transparent colored overlay
- Show `hitFunc` custom areas vs default shape bounds
- Highlight nodes with `listening: false` or `hitGraphEnabled: false` differently
- Show the `hitStrokeWidth` vs `strokeWidth` difference

### 6. Scene Graph Statistics Bar -- DONE

A persistent status bar at the bottom of the panel showing key metrics at a glance.

- Total node count / shape count / container count
- Number of stages / layers
- Number of cached nodes and total cache memory
- Number of nodes with event listeners
- Number of hidden (`visible: false`) nodes
- Konva version

## Tier 2 -- Medium Impact, Significant Quality-of-Life

### 7. Enhanced Search -- DONE

The current search only does prefix match on `className`. Upgrade to be genuinely useful.

- Full regex support (the placeholder already promises it)
- Search by any attribute value (e.g., `fill:red`, `name:player`)
- Search by node `_id`
- Filter tree to only show matching nodes (not just highlight)
- Keyboard shortcut (Cmd+F / Ctrl+F) to focus search

### 8. Export / Import Scene Graph -- DONE

- **Export**: Serialize the full scene graph as JSON via `stage.toJSON()`, download as file
- **Export selected**: Export just the selected subtree
- **Import**: Load a JSON file and reconstruct the scene (for debugging snapshots) -- imports into selected container or first layer
- **Copy node as code**: Generate a Konva constructor call for the selected node (e.g., `new Konva.Rect({ x: 10, y: 20, width: 100, ... })`)

### 9. Animation / Tween Tracker -- DONE

Monitor all active Konva `Tween` and `Animation` instances.

- List running animations with their target nodes, properties being animated, duration, and progress
- Show easing function name, playing/paused status
- New "Animations" tab in the panel with start/stop tracking controls
- Patches `Konva.Tween` and `Konva.Animation` constructors to track instances
- (Pause/resume/restart individual + timeline scrubber not yet)

### 10. Canvas Render Heatmap -- DONE

Visualize which areas of the canvas are being redrawn frequently.

- Overlay that accumulates draw call regions per layer with heat colors (blue → yellow → orange → red)
- Shows draw count labels per layer
- Toggle on/off from the toolbar (heatmap button)
- Reset on page reload

### 11. Node Diff / Change Tracking -- DONE

Track attribute changes over time for the selected node.

- "Take Snapshot" button to freeze current attribute state
- Live diff comparison showing added/removed/changed attributes with color coding
- Re-snapshot and clear controls
- Integrated into InspectedElement panel as collapsible section

### 12. Drag-and-Drop Tree Reorder -- DONE

Allow reordering nodes in the tree by dragging, which changes z-index / parent.

- Drag within the same container to change z-order
- Drag between containers to reparent (`moveTo`)
- Visual drop indicators (blue top/bottom border for before/after, blue ring for inside)
- Drop position determined by cursor position within the target row (top third = before, middle = inside, bottom = after)

## Tier 3 -- Nice to Have, Polish Features

### 13. Visual Attribute Editors -- DONE (color picker + number scrubbing; gradient editor + calculation support not yet)

- **Color picker** for `fill`, `stroke`, `shadowColor` (inline swatch + popover picker)
- **Gradient editor** for linear/radial gradients (visual stops editor)
- **Number scrubbing** -- click-and-drag on number inputs to scrub values (like CSS DevTools)
- **Calculation support** in number fields (e.g., type `100*2` to get `200`, like PixiJS DevTools)

### 14. Transform Gizmo -- DONE

Add visual handles to the overlay for the selected node.

- Drag corners to resize, drag edges to scale on one axis
- Rotation handle (blue circle above node)
- Move by dragging the node body
- Show dimensions label while transforming
- Toggle on/off from toolbar (transform icon button)

### 15. Keyboard Shortcuts -- DONE

- Arrow Up/Down to navigate tree rows
- Arrow Right to expand, Arrow Left to collapse
- Escape to deselect
- Delete/Backspace to remove selected node
- H to toggle visibility of selected node
- L to toggle lock/listening
- Cmd+F / Ctrl+F to focus search

### 16. Bookmark / Pin Nodes -- DONE

- Star/pin frequently inspected nodes for quick access (star icon on hover)
- Pinned nodes section at the top of the tree
- Persisted in `chrome.storage.local`

### 17. Screenshot Tools -- DONE

- Screenshot the full stage as PNG (camera icon in toolbar)
- Screenshot the selected node as PNG (camera icon in inspector)
- Uses `toDataURL({ pixelRatio: 2 })` for high-res output

### 18. Accessibility Insights -- DONE

- Flag interactive nodes (with click/tap listeners) that lack `name` or `id` attributes
- Warn about very small hit areas (<20×20px, recommend ≥44×44px for touch)
- Warn about `listening: false` on node or parent blocking events
- Warn about nearly invisible (opacity<0.1) interactive nodes
- Warn about hidden (visible=false) interactive nodes with listeners
- Collapsible section in the inspector with issue counts and severity badges

---

## Architecture Considerations

Most features above can be implemented by extending the existing `__KONVA_DEVTOOLS_GLOBAL_HOOK__` with new submodules (e.g., `.profiler`, `.events`, `.cache`), following the same `toString()` injection pattern via `connect.ts`. The panel UI would add new tabs or sections to `InspectedElement.tsx`.

Before building new features, the bugs and technical debt in [AGENTS.md](AGENTS.md) (bridge error handling, polling optimization, `this` context bugs, missing error boundaries) should be resolved -- several new features depend on a reliable bridge and event system.

## Suggested Implementation Order

1. ~~Fix existing bugs (bridge errors, selection bugs, filter null deref)~~ DONE -- Bug 6 fixed (detection loop); bugs 1-5 were already fixed
2. ~~`$konva` console variable (quick win, high value)~~ DONE
3. ~~Scene graph statistics bar (quick win, always visible)~~ DONE
4. ~~Enhanced search (fulfills existing promise in the UI)~~ DONE
5. ~~Event listener inspector (high debugging value)~~ DONE
6. ~~Cache inspector (unique to canvas devtools)~~ DONE
7. ~~Performance profiler (highest effort but transformative)~~ DONE
8. ~~Export/import scene graph~~ DONE
9. ~~Hit region visualization~~ DONE
10. ~~Visual attribute editors (color picker, number scrubbing)~~ DONE
11. ~~Animation / Tween Tracker~~ DONE
12. ~~Canvas Render Heatmap~~ DONE
13. ~~Node Diff / Change Tracking~~ DONE
14. ~~Drag-and-Drop Tree Reorder~~ DONE
15. ~~Transform Gizmo~~ DONE
16. ~~Keyboard Shortcuts~~ DONE
17. ~~Bookmark / Pin Nodes~~ DONE
18. ~~Screenshot Tools~~ DONE
19. ~~Accessibility Insights~~ DONE
