import type { IAttr } from './components/constants';
import type konvaDevtools from './devtools/konvaDevtools';
import type konvaDevtoolsOutline from './devtools/konvaDevtoolsOutline';
import type konvaDevtoolsOverlay from './devtools/konvaDevtoolsOverlay';
import type konvaDevtoolsSelection from './devtools/konvaDevtoolsSelection';

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

export type Filter = {
  name: string;
  values: FilterItem[] | null;
};

export type FilterItem = {
  value: any;
  renderer: IAttr;
};
