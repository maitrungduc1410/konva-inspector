import Konva from 'konva';
import { loadBasicExample } from './basic';
import {
  loadMultiStageExample,
  buildShapesStage,
  buildAnimationStage,
  buildInteractiveStage,
} from './multi-stage';
import { loadStressTest } from './stress';
import { loadAccessibilityExample } from './accessibility';

const buttons = {
  basic: document.getElementById('btn-basic') as HTMLButtonElement,
  multi: document.getElementById('btn-multi') as HTMLButtonElement,
  stress: document.getElementById('btn-stress') as HTMLButtonElement,
  a11y: document.getElementById('btn-a11y') as HTMLButtonElement,
};
const statsEl = document.getElementById('stats') as HTMLDivElement;
const canvasArea = document.getElementById('canvas-area') as HTMLDivElement;

let currentStages: Konva.Stage[] = [];
let isMultiMode = false;

function destroyCurrent() {
  for (const stage of currentStages) {
    stage.destroy();
  }
  currentStages = [];
  canvasArea.innerHTML = '';
  statsEl.textContent = '';
  isMultiMode = false;
}

function setActive(activeBtn: HTMLButtonElement) {
  Object.values(buttons).forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

function createContainer(label?: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'stage-wrapper';
  if (label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'stage-label';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);
  }
  const container = document.createElement('div');
  container.className = 'stage-container';
  wrapper.appendChild(container);
  canvasArea.appendChild(wrapper);
  return container;
}

// --- Multi-stage helpers ---

const stageBuilders = [
  { name: 'Shapes & Groups', build: buildShapesStage },
  { name: 'Animation', build: buildAnimationStage },
  { name: 'Interactive Drawing', build: buildInteractiveStage },
];

let stageCounter = 0;

function updateMultiStats() {
  statsEl.textContent = `${currentStages.length} independent Konva stage${currentStages.length !== 1 ? 's' : ''}`;
}

function createMultiStageWrapper(label: string): { wrapper: HTMLDivElement; container: HTMLDivElement } {
  const wrapper = document.createElement('div');
  wrapper.className = 'stage-wrapper';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '8px';
  header.style.marginBottom = '4px';

  const labelEl = document.createElement('div');
  labelEl.className = 'stage-label';
  labelEl.style.margin = '0';
  labelEl.textContent = label;
  header.appendChild(labelEl);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '\u2715 Delete';
  deleteBtn.className = 'stage-delete-btn';
  header.appendChild(deleteBtn);

  wrapper.appendChild(header);

  const container = document.createElement('div');
  container.className = 'stage-container';
  wrapper.appendChild(container);

  deleteBtn.addEventListener('click', () => {
    const idx = Array.from(canvasArea.children).indexOf(wrapper);
    if (idx === -1) return;
    // skip first child if it's the add-stage toolbar
    const stageIdx = idx - (canvasArea.firstElementChild?.classList.contains('add-stage-bar') ? 1 : 0);
    if (stageIdx >= 0 && stageIdx < currentStages.length) {
      currentStages[stageIdx].destroy();
      currentStages.splice(stageIdx, 1);
    }
    wrapper.remove();
    updateMultiStats();
  });

  return { wrapper, container };
}

function addStageToMulti(builderIdx: number) {
  stageCounter++;
  const builder = stageBuilders[builderIdx % stageBuilders.length];
  const label = `Stage ${stageCounter} — ${builder.name}`;
  const { wrapper, container } = createMultiStageWrapper(label);
  canvasArea.appendChild(wrapper);
  const stage = builder.build(container);
  currentStages.push(stage);
  updateMultiStats();
}

function buildAddStageBar(): HTMLDivElement {
  const bar = document.createElement('div');
  bar.className = 'add-stage-bar';

  const label = document.createElement('span');
  label.textContent = 'Add stage:';
  label.style.fontSize = '0.8rem';
  label.style.color = '#7f8c8d';
  bar.appendChild(label);

  stageBuilders.forEach((b, i) => {
    const btn = document.createElement('button');
    btn.textContent = `+ ${b.name}`;
    btn.addEventListener('click', () => addStageToMulti(i));
    bar.appendChild(btn);
  });

  return bar;
}

function loadMultiMode() {
  destroyCurrent();
  setActive(buttons.multi);
  isMultiMode = true;
  stageCounter = 0;

  const addBar = buildAddStageBar();
  canvasArea.appendChild(addBar);

  stageBuilders.forEach((builder, i) => {
    stageCounter++;
    const label = `Stage ${stageCounter} — ${builder.name}`;
    const { wrapper, container } = createMultiStageWrapper(label);
    canvasArea.appendChild(wrapper);
    const stage = builder.build(container);
    currentStages.push(stage);
  });

  updateMultiStats();
}

// --- Event listeners ---

buttons.basic.addEventListener('click', () => {
  destroyCurrent();
  setActive(buttons.basic);
  const container = createContainer();
  currentStages = [loadBasicExample(container)];
});

buttons.multi.addEventListener('click', () => {
  loadMultiMode();
});

buttons.a11y.addEventListener('click', () => {
  destroyCurrent();
  setActive(buttons.a11y);
  const container = createContainer();
  currentStages = [loadAccessibilityExample(container)];
});

buttons.stress.addEventListener('click', () => {
  destroyCurrent();
  setActive(buttons.stress);
  const container = createContainer();
  const start = performance.now();
  const stage = loadStressTest(container);
  currentStages = [stage];
  const elapsed = (performance.now() - start).toFixed(1);
  const count = countNodes(stage);
  statsEl.textContent = `Created ${count.toLocaleString()} nodes in ${elapsed}ms`;
});

function countNodes(stage: Konva.Stage): number {
  let count = 0;
  function walk(node: Konva.Node) {
    count++;
    if ((node as Konva.Container).getChildren) {
      (node as Konva.Container).getChildren().forEach(walk);
    }
  }
  walk(stage);
  return count;
}

// Load basic example on startup
const container = createContainer();
currentStages = [loadBasicExample(container)];
