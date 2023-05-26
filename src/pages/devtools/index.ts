try {
  chrome.devtools.inspectedWindow.eval(
    `
    !!(window.Konva && window.Konva.stages.length)
  `,
    (result, err) => {
      if (result) {
        chrome.devtools.panels.create(
          "Konva",
          "icon-34.png",
          "src/pages/panel/index.html"
        );
      }
    }
  );
} catch (e) {
  console.error(e);
}
