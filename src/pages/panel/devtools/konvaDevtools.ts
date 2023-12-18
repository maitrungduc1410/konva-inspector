import type TKonva from 'konva';

export default function konvaDevtools() {
  const win = window;

  function getGlobal(varname: string) {
    if (win[varname]) {
      return win[varname];
    }
    if (win.frames) {
      for (let i = 0; i < win.frames.length; i++) {
        try {
          if (win.frames[i][varname]) {
            return win.frames[i][varname];
          }
        } catch (_) {
          // access to iframe was denied
        }
      }
    }
    return undefined;
  }

  function Konva(): typeof TKonva {
    return getGlobal('Konva');
  }

  return {
    Konva,
    content(stageIndex = 0) {
      return Konva().stages[stageIndex].getContent();
    },
    stage(stageIndex = 0) {
      return Konva().stages[stageIndex];
    },
  };
}
