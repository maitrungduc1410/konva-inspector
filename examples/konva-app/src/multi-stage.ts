import Konva from 'konva';

type ContainerFactory = (label?: string) => HTMLDivElement;

export function loadMultiStageExample(createContainer: ContainerFactory): Konva.Stage[] {
  return [
    buildShapesStage(createContainer('Stage 1 — Shapes & Groups')),
    buildAnimationStage(createContainer('Stage 2 — Animation')),
    buildInteractiveStage(createContainer('Stage 3 — Interactive Drawing')),
  ];
}

export function buildShapesStage(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({ container, width: 900, height: 250 });
  const layer = new Konva.Layer({ name: 'shapes-layer' });
  stage.add(layer);

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

  for (let i = 0; i < 6; i++) {
    layer.add(
      new Konva.Rect({
        x: 20 + i * 145, y: 20, width: 120, height: 70,
        fill: colors[i], cornerRadius: 6, draggable: true, name: `rect-${i}`,
      }),
    );
  }

  const group = new Konva.Group({ x: 20, y: 120, draggable: true, name: 'card-group' });
  layer.add(group);

  group.add(new Konva.Rect({ width: 250, height: 100, fill: '#2c3e50', cornerRadius: 8, name: 'card-bg' }));
  group.add(new Konva.Circle({ x: 45, y: 50, radius: 25, fill: '#3498db', name: 'card-avatar' }));
  group.add(new Konva.Text({ x: 85, y: 25, text: 'Grouped Card', fontSize: 16, fill: '#ecf0f1', name: 'card-title' }));
  group.add(new Konva.Text({ x: 85, y: 50, text: 'Nested children in a group', fontSize: 12, fill: '#95a5a6', name: 'card-subtitle' }));

  const nestedGroup = new Konva.Group({ x: 300, y: 120, draggable: true, name: 'nested-outer' });
  layer.add(nestedGroup);

  const innerGroup = new Konva.Group({ x: 10, y: 10, name: 'nested-inner' });
  nestedGroup.add(innerGroup);
  nestedGroup.add(new Konva.Rect({ width: 200, height: 100, fill: '#1a1a2e', stroke: '#444', strokeWidth: 1, cornerRadius: 6, name: 'nested-border' }));
  const star = new Konva.Star({ x: 40, y: 40, numPoints: 5, innerRadius: 12, outerRadius: 28, fill: '#f1c40f', name: 'nested-star' });
  innerGroup.add(star);
  const ring = new Konva.Ring({ x: 120, y: 40, innerRadius: 12, outerRadius: 25, fill: '#1abc9c', name: 'nested-ring' });
  innerGroup.add(ring);

  new Konva.Tween({
    node: star,
    duration: 1.2,
    scaleX: 1.4,
    scaleY: 1.4,
    easing: Konva.Easings.EaseInOut,
    yoyo: true,
  }).play();

  new Konva.Tween({
    node: ring,
    duration: 2,
    rotation: 360,
    easing: Konva.Easings.Linear,
    onFinish: function (this: Konva.Tween) { this.reset(); this.play(); },
  }).play();

  const pulseRect = layer.findOne('.rect-0') as Konva.Rect;
  if (pulseRect) {
    new Konva.Tween({
      node: pulseRect,
      duration: 0.8,
      opacity: 0.4,
      easing: Konva.Easings.EaseInOut,
      yoyo: true,
    }).play();
  }

  layer.add(
    new Konva.Text({
      x: 560, y: 140, text: 'Stage 1: shapes, groups,\nnested groups + tweens',
      fontSize: 13, fontFamily: 'system-ui, sans-serif', fill: '#7f8c8d', lineHeight: 1.4, name: 'info-text',
    }),
  );

  return stage;
}

export function buildAnimationStage(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({ container, width: 900, height: 200 });
  const layer = new Konva.Layer({ name: 'animation-layer' });
  stage.add(layer);

  const orbs: Konva.Circle[] = [];
  const ORB_COUNT = 8;
  for (let i = 0; i < ORB_COUNT; i++) {
    const orb = new Konva.Circle({
      x: 60 + i * 100, y: 100,
      radius: 18 + (i % 3) * 6,
      fill: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#d35400'][i],
      opacity: 0.85,
      name: `orb-${i}`,
    });
    layer.add(orb);
    orbs.push(orb);
  }

  layer.add(
    new Konva.Text({
      x: 10, y: 10, text: 'Stage 2: Animation + Tweens',
      fontSize: 13, fontFamily: 'system-ui, sans-serif', fill: '#7f8c8d', name: 'anim-info',
    }),
  );

  new Konva.Tween({
    node: orbs[0],
    duration: 1.5,
    scaleX: 1.6,
    scaleY: 1.6,
    easing: Konva.Easings.EaseInOut,
    yoyo: true,
  }).play();

  new Konva.Tween({
    node: orbs[orbs.length - 1],
    duration: 2,
    fill: '#ffffff',
    easing: Konva.Easings.EaseInOut,
    yoyo: true,
  }).play();

  const speeds = orbs.map(() => 0.8 + Math.random() * 1.5);
  const directions = orbs.map(() => (Math.random() > 0.5 ? 1 : -1));

  const anim = new Konva.Animation((frame) => {
    if (!frame) return;
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      let y = orb.y() + speeds[i] * directions[i];
      if (y < 30 || y > 170) {
        directions[i] *= -1;
        y = Math.max(30, Math.min(170, y));
      }
      orb.y(y);
    }
  }, layer);
  anim.start();

  return stage;
}

export function buildInteractiveStage(container: HTMLDivElement): Konva.Stage {
  const stage = new Konva.Stage({ container, width: 900, height: 200 });

  const bgLayer = new Konva.Layer({ name: 'bg-layer' });
  stage.add(bgLayer);
  bgLayer.add(new Konva.Rect({ width: 900, height: 200, fill: '#16213e', name: 'canvas-bg' }));
  bgLayer.add(
    new Konva.Text({
      x: 10, y: 10, text: 'Stage 3: click to place circles, drag to move them',
      fontSize: 13, fontFamily: 'system-ui, sans-serif', fill: '#7f8c8d', name: 'draw-info',
    }),
  );

  const drawLayer = new Konva.Layer({ name: 'draw-layer' });
  stage.add(drawLayer);

  let count = 0;
  stage.on('click', (e) => {
    if (e.target !== stage && e.target.name() !== 'canvas-bg') return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    count++;
    const hue = (count * 37) % 360;
    drawLayer.add(
      new Konva.Circle({
        x: pos.x, y: pos.y,
        radius: 10 + Math.random() * 15,
        fill: `hsl(${hue}, 70%, 55%)`,
        draggable: true,
        name: `drawn-${count}`,
      }),
    );
  });

  return stage;
}
