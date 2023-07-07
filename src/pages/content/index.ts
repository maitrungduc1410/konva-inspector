detect();
const interval = setInterval(detect, 5000);
let count = 0;
let shouldBroadcastToBackground = true;

function detect(requestDetectionCallback?: (data: any) => void) {
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("src/pages/detector/index.js");
    document.body.appendChild(s);
    s.onload = () => {
      document.addEventListener(
        "__KONVA_DEVTOOLS__DETECTION_RESULT",
        function (e: CustomEvent) {
          if (shouldBroadcastToBackground) {
            chrome.runtime
              .sendMessage({
                type: "__KONVA_DEVTOOLS__BROADCAST_RESULT",
                result: e.detail,
              })
              .catch(() => {
                // stop sending to background script if connection between content_script <-> background_script is failed
                shouldBroadcastToBackground = false;
              })
              .finally(() => {
                // clear interval once detected or reach limit
                // otherwise the interval can run thousands of times (after few mins) when connection is failed (not sure why, probably when background_script becomes inactive?), and browser will get hanged
                if (e.detail || count >= 10) {
                  clearInterval(interval);
                } else {
                  count++;
                }
              });
          }

          s.remove();
          requestDetectionCallback && requestDetectionCallback(e.detail);
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
  if (request["type"] === "__KONVA_DEVTOOLS__REQUEST_DETECTION") {
    detect(sendResponse);
  }
  return true; // this make sure sendResponse will work asynchronously
});
