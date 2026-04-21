import Konva from 'konva';

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;

export function loadBasicExample(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({
    container,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  // ── Layer 1: Shapes ──

  const shapesLayer = new Konva.Layer({ name: 'shapes-layer' });
  stage.add(shapesLayer);

  shapesLayer.add(
    new Konva.Rect({
      x: 40, y: 40, width: 120, height: 80,
      fill: '#e74c3c', cornerRadius: 8, draggable: true, name: 'red-rect',
      shadowColor: '#000', shadowBlur: 10,
      shadowOffsetX: 4, shadowOffsetY: 4, shadowOpacity: 0.3,
    }),
  );

  shapesLayer.add(
    new Konva.Circle({ x: 260, y: 80, radius: 50, fill: '#3498db', draggable: true, name: 'blue-circle' }),
  );

  shapesLayer.add(
    new Konva.Ellipse({ x: 400, y: 80, radiusX: 60, radiusY: 35, fill: '#2ecc71', draggable: true, name: 'green-ellipse' }),
  );

  shapesLayer.add(
    new Konva.Star({ x: 560, y: 80, numPoints: 5, innerRadius: 20, outerRadius: 45, fill: '#f1c40f', stroke: '#e67e22', strokeWidth: 2, draggable: true, name: 'yellow-star' }),
  );

  shapesLayer.add(
    new Konva.Ring({ x: 700, y: 80, innerRadius: 20, outerRadius: 40, fill: '#9b59b6', draggable: true, name: 'purple-ring' }),
  );

  shapesLayer.add(
    new Konva.Wedge({ x: 820, y: 80, radius: 45, angle: 120, fill: '#1abc9c', rotation: -60, draggable: true, name: 'teal-wedge' }),
  );

  // ── Text ──

  shapesLayer.add(
    new Konva.Text({ x: 40, y: 170, text: 'Hello Konva Inspector!', fontSize: 24, fontFamily: 'system-ui, sans-serif', fill: '#ecf0f1', draggable: true, name: 'greeting-text' }),
  );

  // ── Lines and Arrows ──

  shapesLayer.add(
    new Konva.Line({ points: [40, 230, 150, 280, 260, 230, 370, 280], stroke: '#e67e22', strokeWidth: 3, tension: 0.4, draggable: true, name: 'orange-line' }),
  );

  shapesLayer.add(
    new Konva.Arrow({ points: [420, 250, 580, 250], pointerLength: 12, pointerWidth: 10, fill: '#e74c3c', stroke: '#e74c3c', strokeWidth: 3, draggable: true, name: 'red-arrow' }),
  );

  // ── Group with nested children ──

  const group = new Konva.Group({ x: 40, y: 320, draggable: true, name: 'nested-group' });
  shapesLayer.add(group);

  group.add(new Konva.Rect({ width: 200, height: 120, fill: '#2c3e50', cornerRadius: 6, name: 'group-background' }));
  group.add(new Konva.Text({ x: 10, y: 10, text: 'Grouped Items', fontSize: 14, fill: '#95a5a6', name: 'group-label' }));
  group.add(new Konva.Circle({ x: 60, y: 80, radius: 20, fill: '#e74c3c', name: 'group-circle-1' }));
  group.add(new Konva.Circle({ x: 120, y: 80, radius: 20, fill: '#3498db', name: 'group-circle-2' }));

  // ── Regular Polygon ──

  shapesLayer.add(
    new Konva.RegularPolygon({ x: 360, y: 380, sides: 6, radius: 45, fill: '#8e44ad', stroke: '#9b59b6', strokeWidth: 2, draggable: true, name: 'hexagon' }),
  );

  // ── Path ──

  shapesLayer.add(
    new Konva.Path({ x: 460, y: 320, data: 'M 0 0 C 30 -40, 70 -40, 100 0 S 170 40, 200 0', stroke: '#1abc9c', strokeWidth: 3, draggable: true, name: 'bezier-path' }),
  );

  // ── Transformer ──

  const transformTarget = new Konva.Rect({ x: 680, y: 320, width: 100, height: 80, fill: '#e67e22', cornerRadius: 4, draggable: true, name: 'transform-target' });
  shapesLayer.add(transformTarget);

  const transformer = new Konva.Transformer({
    nodes: [transformTarget], name: 'main-transformer',
    borderStroke: '#3498db', anchorFill: '#fff', anchorStroke: '#3498db', anchorSize: 8,
  });
  shapesLayer.add(transformer);

  // ── Layer 2: Filtered shapes ──

  const filtersLayer = new Konva.Layer({ name: 'filters-layer' });
  stage.add(filtersLayer);

  const blurredRect = new Konva.Rect({ x: 40, y: 480, width: 140, height: 80, fill: '#2ecc71', cornerRadius: 6, draggable: true, name: 'blurred-rect' });
  filtersLayer.add(blurredRect);
  blurredRect.cache();
  blurredRect.filters([Konva.Filters.Blur]);
  blurredRect.blurRadius(5);

  const brightenedCircle = new Konva.Circle({ x: 280, y: 520, radius: 40, fill: '#e74c3c', draggable: true, name: 'brightened-circle' });
  filtersLayer.add(brightenedCircle);
  brightenedCircle.cache();
  brightenedCircle.filters([Konva.Filters.Brighten]);
  brightenedCircle.brightness(0.3);

  const contrastStar = new Konva.Star({ x: 420, y: 520, numPoints: 6, innerRadius: 18, outerRadius: 40, fill: '#f39c12', draggable: true, name: 'contrast-star' });
  filtersLayer.add(contrastStar);
  contrastStar.cache();
  contrastStar.filters([Konva.Filters.Contrast]);
  contrastStar.contrast(40);

  // ── Image node ──

  const imageObj = new Image();
  imageObj.onload = () => {
    filtersLayer.add(
      new Konva.Image({ x: 540, y: 470, image: imageObj, width: 120, height: 90, cornerRadius: 6, draggable: true, name: 'sample-image' }),
    );
  };
  imageObj.src =
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs>
        <rect width="120" height="90" rx="6" fill="url(#g)"/>
        <text x="60" y="50" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif">Image</text>
      </svg>`,
    );

  filtersLayer.add(
    new Konva.Text({ x: 700, y: 490, text: 'Shapes on this layer\nhave Konva filters applied', fontSize: 13, fontFamily: 'system-ui, sans-serif', fill: '#7f8c8d', lineHeight: 1.4, name: 'filter-info-text' }),
  );

  // ── Interaction ──

  stage.on('click tap', (e) => {
    if (e.target === stage) transformer.nodes([]);
  });

  shapesLayer.on('click tap', (e) => {
    const target = e.target as Konva.Node;
    if (target === (shapesLayer as Konva.Node) || target === (transformer as Konva.Node)) return;
    transformer.nodes([target]);
  });

  return stage;
}
