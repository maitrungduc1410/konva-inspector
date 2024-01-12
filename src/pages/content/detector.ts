import type Konva from 'konva';

declare global {
  interface Window {
    Konva: typeof Konva;
  }
}

document.addEventListener('__KONVA_DEVTOOLS__DETECT_KONVA', function () {
  document.dispatchEvent(
    new CustomEvent('__KONVA_DEVTOOLS__DETECTION_RESULT', {
      detail: !!window.Konva && !!window.Konva.stages && !!window.Konva.Util,
    }),
  );
});
