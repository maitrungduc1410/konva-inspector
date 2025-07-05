export type InputType = 'string' | 'number' | 'boolean' | 'json' | 'select';

export interface IAttr {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select';
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: any }>;
}

export const NODE_ATTRS: IAttr[] = [
  {
    name: 'x',
    type: 'number',
  },
  {
    name: 'y',
    type: 'number',
  },
  {
    name: 'width',
    type: 'number',
  },
  {
    name: 'height',
    type: 'number',
  },
  {
    name: 'visible',
    type: 'boolean',
  },
  {
    name: 'listening',
    type: 'boolean',
  },
  {
    name: 'id',
    type: 'string',
  },
  {
    name: 'name',
    type: 'string',
  },
  {
    name: 'opacity',
    type: 'number',
    min: 0,
    step: 0.05,
  },
  {
    name: 'scaleX',
    type: 'number',
  },
  {
    name: 'scaleY',
    type: 'number',
  },
  {
    name: 'rotateEnabled',
    type: 'boolean',
  },
  {
    name: 'rotation',
    type: 'number',
  },
  {
    name: 'rotationDeg',
    type: 'number',
  },
  {
    name: 'offsetX',
    type: 'number',
  },
  {
    name: 'offsetY',
    type: 'number',
  },
  {
    name: 'skewX',
    type: 'number',
  },
  {
    name: 'skewY',
    type: 'number',
  },
  {
    name: 'draggable',
    type: 'boolean',
    defaultValue: false,
  },
  {
    name: 'dragDistance',
    type: 'number',
  },
];

export const SHAPE_ATTRS: IAttr[] = [
  {
    name: 'fill',
    type: 'string',
  },
  {
    name: 'fillPatternX',
    type: 'number',
  },
  {
    name: 'fillPatternY',
    type: 'number',
  },
  {
    name: 'fillPatternOffsetX',
    type: 'number',
  },
  {
    name: 'fillPatternOffsetY',
    type: 'number',
  },
  {
    name: 'fillPatternScaleX',
    type: 'number',
  },
  {
    name: 'fillPatternScaleY',
    type: 'number',
  },
  {
    name: 'fillPatternRotation',
    type: 'number',
  },
  {
    name: 'fillPatternRepeat',
    type: 'string',
  },
  {
    name: 'fillLinearGradientStartPointX',
    type: 'number',
  },
  {
    name: 'fillLinearGradientStartPointY',
    type: 'number',
  },
  {
    name: 'fillLinearGradientEndPointX',
    type: 'number',
  },
  {
    name: 'fillLinearGradientEndPointY',
    type: 'number',
  },
  {
    name: 'fillRadialGradientColorStops',
    type: 'json',
  },
  {
    name: 'fillEnabled',
    type: 'boolean',
  },
  {
    name: 'fillPriority',
    type: 'string',
  },
  {
    name: 'stroke',
    type: 'string',
  },
  {
    name: 'strokeWidth',
    type: 'number',
    min: 0,
  },
  {
    name: 'fillAfterStrokeEnabled',
    type: 'boolean',
    defaultValue: false,
  },
  {
    name: 'hitStrokeWidth',
    type: 'number',
  },
  {
    name: 'strokeScaleEnabled',
    type: 'boolean',
  },
  {
    name: 'strokeHitEnabled',
    type: 'boolean',
  },
  {
    name: 'strokeEnabled',
    type: 'boolean',
  },
  {
    name: 'shadowColor',
    type: 'string',
  },
  {
    name: 'shadowBlur',
    type: 'number',
    min: 0,
  },
  {
    name: 'shadowOffsetX',
    type: 'number',
  },
  {
    name: 'shadowOffsetY',
    type: 'number',
  },
  {
    name: 'shadowOpacity',
    type: 'number',
    min: 0,
    step: 0.05,
  },
  {
    name: 'shadowEnabled',
    type: 'boolean',
  },
  {
    name: 'shadowForStrokeEnabled',
    type: 'boolean',
  },
  {
    name: 'dash',
    type: 'json',
  },
  {
    name: 'dashOffset',
    type: 'number',
  },
  {
    name: 'dashEnabled',
    type: 'boolean',
  },
  {
    name: 'perfectDrawEnabled',
    type: 'boolean',
  },
];

export const SHAPE_CUSTOM_ATTRS: Record<string, IAttr[]> = {
  Layer: [
    { name: 'clearBeforeDraw', type: 'boolean' },
    { name: 'hitGraphEnabled', type: 'boolean' },
    { name: 'imageSmoothingEnabled', type: 'boolean' },
  ],
  Group: [
    { name: 'clearBeforeDraw', type: 'boolean' },
    { name: 'clipX', type: 'number' },
    { name: 'clipY', type: 'number' },
    { name: 'clipWidth', type: 'number' },
    { name: 'clipHeight', type: 'number' },
  ],
  Label: [
    { name: 'clearBeforeDraw', type: 'boolean' },
    { name: 'clipX', type: 'number' },
    { name: 'clipY', type: 'number' },
    { name: 'clipWidth', type: 'number' },
    { name: 'clipHeight', type: 'number' },
  ],

  Rect: [
    {
      name: 'cornerRadius',
      type: 'number',
      min: 0,
    },
  ],

  Circle: [
    {
      name: 'radius',
      type: 'number',
      min: 0,
    },
  ],
  Ellipse: [
    {
      name: 'radiusX',
      type: 'number',
      min: 0,
    },
    {
      name: 'radiusY',
      type: 'number',
      min: 0,
    },
  ],
  Wedge: [
    {
      name: 'angle',
      type: 'number',
    },
    {
      name: 'radius',
      type: 'number',
      min: 0,
    },
    {
      name: 'clockwise',
      type: 'boolean',
    },
  ],
  Transformer: [
    { name: 'resizeEnabled', type: 'boolean' },
    { name: 'rotateEnabled', type: 'boolean' },
    { name: 'rotationSnaps', type: 'json' },
    { name: 'rotationSnapTolerance', type: 'number' },
    { name: 'rotateAnchorOffset', type: 'number' },
    { name: 'borderEnabled', type: 'boolean' },
    { name: 'borderStroke', type: 'string' },
    { name: 'borderStrokeWidth', type: 'number' },
    { name: 'borderDash', type: 'json' },
    { name: 'anchorFill', type: 'string' },
    { name: 'anchorStroke', type: 'string' },
    { name: 'anchorStrokeWidth', type: 'number' },
    { name: 'anchorSize', type: 'number' },
    { name: 'anchorCornerRadius', type: 'number' },
    { name: 'keepRatio', type: 'boolean' },
    { name: 'shiftBehavior', type: 'string' },
    { name: 'centeredScaling', type: 'boolean', defaultValue: false },
    { name: 'enabledAnchors', type: 'json' },
    { name: 'flipEnabled', type: 'boolean' },
    { name: 'ignoreStroke', type: 'boolean', defaultValue: false },
    { name: 'useSingleNodeRotation', type: 'boolean' },
    { name: 'shouldOverdrawWholeArea', type: 'boolean', defaultValue: false },
  ],
  Line: [
    { name: 'points', type: 'json' },
    { name: 'tension', type: 'number' },
    { name: 'closed', type: 'boolean', defaultValue: false },
    { name: 'bezier', type: 'boolean', defaultValue: false },
  ],
  Sprite: [
    { name: 'animation', type: 'string' },
    { name: 'frameIndex', type: 'number', min: 0 },
    { name: 'frameRate', type: 'number', min: 0 },
  ],
  Image: [
    {
      name: 'image',
      type: 'string',
    },
    { name: 'crop', type: 'json' },
    {
      name: 'cornerRadius',
      type: 'number',
      min: 0,
    },
  ],
  Text: [
    { name: 'text', type: 'string' },
    { name: 'fontFamily', type: 'string' },
    { name: 'fontSize', type: 'number', min: 0 },
    { name: 'fontStyle', type: 'string' },
    { name: 'fontVariant', type: 'string' },
    { name: 'textDecoration', type: 'string' },
    { name: 'align', type: 'string' },
    { name: 'verticalAlign', type: 'string' },
    { name: 'padding', type: 'number' },
    { name: 'lineHeight', type: 'number' },
    { name: 'letterSpacing', type: 'number' },
    { name: 'wrap', type: 'string' },
    { name: 'ellipsis', type: 'boolean', defaultValue: false },
  ],
  TextPath: [
    { name: 'text', type: 'string' },
    { name: 'data', type: 'string' },
    { name: 'fontFamily', type: 'string' },
    { name: 'fontSize', type: 'number', min: 0 },
    { name: 'fontStyle', type: 'string' },
    { name: 'letterSpacing', type: 'number' },
  ],
  Star: [
    { name: 'numPoints', type: 'number', min: 0 },
    { name: 'innerRadius', type: 'number', min: 0 },
    { name: 'outerRadius', type: 'number', min: 0 },
  ],
  Ring: [
    { name: 'innerRadius', type: 'number', min: 0 },
    { name: 'outerRadius', type: 'number', min: 0 },
  ],
  Arc: [
    { name: 'angle', type: 'number' },
    { name: 'innerRadius', type: 'number', min: 0 },
    { name: 'outerRadius', type: 'number', min: 0 },
    { name: 'clockwise', type: 'boolean' },
  ],
  Tag: [
    { name: 'pointerDirection', type: 'number' },
    { name: 'pointerWidth', type: 'number', min: 0 },
    { name: 'pointerHeight', type: 'number', min: 0 },
    { name: 'cornerRadius', type: 'json' },
  ],
  Path: [{ name: 'data', type: 'string' }],
  RegularPolygon: [
    {
      name: 'sides',
      type: 'number',
    },
    {
      name: 'radius',
      type: 'number',
    },
  ],
  Arrow: [
    {
      name: 'points',
      type: 'json',
    },
    {
      name: 'tension',
      type: 'number',
    },
    {
      name: 'closed',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'pointerLength',
      type: 'number',
    },
    {
      name: 'pointerWidth',
      type: 'number',
    },
    {
      name: 'pointerAtBeginning',
      type: 'boolean',
    },
    {
      name: 'pointerAtEnding',
      type: 'boolean',
    },
  ],
};

export const FILTER_SELECT = [
  'Blur',
  'Brighten',
  'Contrast',
  'Emboss',
  'Enhance',
  'Grayscale',
  'HSL',
  'HSV',
  'Invert',
  'Kaleidoscope',
  'Mask',
  'Noise',
  'Pixelate',
  'Posterize',
  'RGB',
  'RGBA',
  'Sepia',
  'Solarize',
  'Threshold',
];
