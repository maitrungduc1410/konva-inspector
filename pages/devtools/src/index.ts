detectFromDevtool();

const detectFromDevtoolInterval = setInterval(detectFromDevtool, 1000);

function detectFromDevtool() {
  try {
    chrome.devtools.inspectedWindow.eval(
      `
      !!(window.Konva && window.Konva.stages.length)
    `,
      (result, err) => {
        if (err) {
          console.log(err);
          clearInterval(detectFromDevtoolInterval);
        } else if (result) {
          clearInterval(detectFromDevtoolInterval);
          chrome.devtools.panels.create('Konva', '/icon38.png', '/devtools-panel/index.html');
        }
      },
    );
  } catch (e) {
    clearInterval(detectFromDevtoolInterval);
    console.error(e);
  }
}
