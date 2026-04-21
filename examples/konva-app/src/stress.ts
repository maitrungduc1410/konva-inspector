import Konva from 'konva';

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;
const TOTAL_NODES = 10_000;
const COLS = 125;
const CELL = 7;

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#d35400', '#8e44ad',
  '#16a085', '#c0392b', '#2980b9', '#27ae60', '#f39c12',
];

const SHAPE_FACTORIES: Array<(x: number, y: number, size: number, color: string, i: number) => Konva.Shape> = [
  (x, y, size, color, i) =>
    new Konva.Rect({ x, y, width: size, height: size, fill: color, name: `rect-${i}` }),
  (x, y, size, color, i) =>
    new Konva.Circle({ x: x + size / 2, y: y + size / 2, radius: size / 2, fill: color, name: `circle-${i}` }),
  (x, y, size, color, i) =>
    new Konva.RegularPolygon({ x: x + size / 2, y: y + size / 2, sides: 6, radius: size / 2, fill: color, name: `hex-${i}` }),
];

export function loadStressTest(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({
    container,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  // Spread nodes across multiple layers to test multi-layer handling
  const LAYER_COUNT = 4;
  const layers: Konva.Layer[] = [];
  for (let l = 0; l < LAYER_COUNT; l++) {
    const layer = new Konva.Layer({ name: `stress-layer-${l}` });
    stage.add(layer);
    layers.push(layer);
  }

  // Also test deeply nested groups: 10 groups per layer, each containing a share of the nodes
  const GROUPS_PER_LAYER = 10;
  const groups: Konva.Group[] = [];
  for (let l = 0; l < LAYER_COUNT; l++) {
    for (let g = 0; g < GROUPS_PER_LAYER; g++) {
      const group = new Konva.Group({ name: `group-L${l}-G${g}` });
      layers[l].add(group);
      groups.push(group);
    }
  }

  const totalGroups = groups.length;

  for (let i = 0; i < TOTAL_NODES; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL;
    const y = row * CELL;
    const color = COLORS[i % COLORS.length];
    const factory = SHAPE_FACTORIES[i % SHAPE_FACTORIES.length];
    const shape = factory(x, y, CELL - 1, color, i);

    const groupIdx = i % totalGroups;
    groups[groupIdx].add(shape);
  }

  // Add a summary text on top
  const infoLayer = new Konva.Layer({ name: 'info-layer' });
  stage.add(infoLayer);
  infoLayer.add(
    new Konva.Text({
      x: 10, y: 10,
      text: `Stress test: ${TOTAL_NODES.toLocaleString()} shapes across ${LAYER_COUNT} layers, ${totalGroups} groups`,
      fontSize: 14,
      fontFamily: 'system-ui, sans-serif',
      fill: '#fff',
      name: 'stress-info',
    }),
  );

  return stage;
}
