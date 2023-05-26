import konvaDevtools from "./devtools/konvaDevtools";
import konvaDevtoolsOutline from "./devtools/konvaDevtoolsOutline";
import konvaDevtoolsOverlay from "./devtools/konvaDevtoolsOverlay";
import konvaDevtoolsSelection from "./devtools/konvaDevtoolsSelection";
import konvaDevtoolsViewport from "./devtools/konvaDevtoolsViewport";

export type KonvaDevtools = ReturnType<typeof konvaDevtools> & {
  selection: ReturnType<typeof konvaDevtoolsSelection>;
  viewport: ReturnType<typeof konvaDevtoolsViewport>;
  overlay: ReturnType<typeof konvaDevtoolsOverlay>;
  outline: ReturnType<typeof konvaDevtoolsOutline>;
  // properties: ReturnType<typeof konvaDevtoolsProperties>;
};

export type OutlineNode = {
  attrs: Record<string, any>;
  className: string;
  _id: number;
  isShape: boolean;
  children?: OutlineNode[];
};
