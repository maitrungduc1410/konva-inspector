# Store Listing — KonvaJS Devtools

Use the sections below when publishing to Chrome Web Store, Firefox Add-ons, and Edge Add-ons.

---

## Name

KonvaJS Devtools

## Short Description (132 chars max)

Inspect, debug, and profile Konva.js canvas apps. Browse the scene graph, edit attributes live, track animations, and find issues.

## Category

Developer Tools

---

## Detailed Description

KonvaJS Devtools adds a "Konva" panel to your browser DevTools that lets you inspect and debug any Konva.js canvas application in real time — like React DevTools, but for Konva.

### Elements

Browse the full scene graph (Stages, Layers, Groups, Shapes) in a virtualized tree view that stays smooth even with thousands of nodes.

• Click any node on the canvas to select it in the tree, or navigate with arrow keys
• Edit attributes live — colors with a color picker, numbers with drag-to-scrub
• Add, remove, and configure Konva image filters (plus native CSS filters on Konva v10)
• Inspect event listeners and instantly spot "listening: false" issues blocking pointer events
• View cache status, dimensions, and estimated memory; enable or clear cache with one click
• Take an attribute snapshot and watch for changes in real time (change tracking)
• Search by class name, /regex/, attr:value, or #id
• Drag and drop nodes to change z-order or reparent them
• Export any stage as JSON, import JSON back into the scene
• Copy a node as a "new Konva.X({...})" constructor call for quick reproduction
• Toggle a hit-region overlay to see which shapes receive pointer events
• Toggle a render heatmap to see which layers redraw most frequently
• Pin/bookmark frequently inspected nodes for quick access (persisted across sessions)
• Use the transform gizmo to resize, rotate, and move nodes directly on the canvas
• Screenshot the entire stage or a single node as a high-resolution PNG
• Accessibility insights flag missing names, tiny hit areas, blocked listeners, low opacity, and hidden interactive nodes
• The selected node is always available as $konva in the console

### Profiler

Record Layer.draw() calls and measure exactly how long each layer takes to render.

• Per-layer summary with draw count, average time, max time, and total time
• Visual bar charts for quick comparison across layers
• Recent draws timeline showing individual draw events with timestamps

### Animations

Monitor every running Konva.Animation and Konva.Tween in real time.

• See target layers for each animation and animated properties for each tween
• Stale entries from destroyed stages are automatically filtered out
• A green "Live" indicator pulses whenever animations or tweens are active

### Keyboard Shortcuts

• Arrow Up/Down — navigate the tree
• Arrow Right/Left — expand/collapse nodes
• Delete/Backspace — remove the selected node
• H — toggle visibility
• L — toggle listening
• Cmd/Ctrl+F — focus search
• Escape — deselect

### General

• Supports Konva v9 and v10
• Multiple stages on the same page
• Dark and light theme (follows system preference)
• Works on Chrome, Edge, and Firefox

---

## Privacy

KonvaJS Devtools does not collect, transmit, or store any user data. All inspection happens locally inside your browser's DevTools. The extension requires host permissions solely to inject a detection script that checks whether the current page uses Konva.js. No data ever leaves your machine.

### Single Purpose Description

This extension adds a DevTools panel for inspecting, debugging, and profiling Konva.js canvas applications.

### Permissions Justification

• host_permissions () — Required to inject a lightweight detection script into every page to check for the presence of window.Konva. Without this, the extension cannot determine which pages use Konva.js.
• storage — Used to persist user preferences (theme, pinned nodes) across sessions via chrome.storage.local. No remote storage is involved.