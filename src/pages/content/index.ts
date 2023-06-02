let lastResult = false;

detect();
const interval = setInterval(detect, 5000);

function detect() {
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("src/pages/detector/index.js");
    document.body.appendChild(s);
    s.onload = () => {
      document.addEventListener(
        "__KONVA_DEVTOOLS__DETECTION_RESULT",
        function (e: CustomEvent) {
          lastResult = e.detail;

          chrome.runtime.sendMessage({
            type: "__KONVA_DEVTOOLS__BROADCAST_RESULT",
            result: lastResult,
          });
          s.remove();
        }
      );

      document.dispatchEvent(new CustomEvent("__KONVA_DEVTOOLS__DETECT_KONVA"));
    };
  } catch (error) {
    clearInterval(interval);
    console.log(error);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request["type"] == "__KONVA_DEVTOOLS__REQUEST_DETECTION") {
    sendResponse(lastResult);
  }
  return true; // this make sure sendResponse will work asynchronously
});
