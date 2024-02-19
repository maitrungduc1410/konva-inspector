detect();

function detect(requestDetectionCallback?: (data: any) => void) {
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('src/pages/detector/index.js');
    document.body.appendChild(s);
    s.onload = () => {
      document.addEventListener('__KONVA_DEVTOOLS__DETECTION_RESULT', function (e: CustomEvent) {
        chrome.runtime
          .sendMessage({
            type: '__KONVA_DEVTOOLS__BROADCAST_RESULT',
            result: e.detail,
          })
          .catch(() => {});

        s.remove();
        requestDetectionCallback && requestDetectionCallback(e.detail);
      });

      document.dispatchEvent(new CustomEvent('__KONVA_DEVTOOLS__DETECT_KONVA'));
    };
  } catch (error) {
    console.log(error);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request['type'] === '__KONVA_DEVTOOLS__REQUEST_DETECTION') {
    detect(sendResponse);
  }
  return true; // this make sure sendResponse will work asynchronously
});
