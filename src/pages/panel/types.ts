import konvaDevtools from "./devtools/konvaDevtools";
import konvaDevtoolsOutline from "./devtools/konvaDevtoolsOutline";
import konvaDevtoolsOverlay from "./devtools/konvaDevtoolsOverlay";
import konvaDevtoolsSelection from "./devtools/konvaDevtoolsSelection";

export type KonvaDevtools = ReturnType<typeof konvaDevtools> & {
  selection: ReturnType<typeof konvaDevtoolsSelection>;
  overlay: ReturnType<typeof konvaDevtoolsOverlay>;
  outline: ReturnType<typeof konvaDevtoolsOutline>;
};

export type OutlineNode = {
  attrs: Record<string, any>;
  className: string;
  _id: number;
  isShape: boolean;
  children?: OutlineNode[];
};
