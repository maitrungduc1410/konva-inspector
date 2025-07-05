detect();

function detect(requestDetectionCallback?: (data: any) => void) {
  // this variable should be within the scope of detect function
  // because from Popup page we will also trigger detect, so if it's already detected before, when clicking Popup page it will append script to host page but will not removing it
  let shouldDetect = true;
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('content/detector.iife.js');
    document.body.appendChild(s);

    document.addEventListener('__KONVA_DEVTOOLS__DETECTION_RESULT', function (e: Event) {
      shouldDetect = false;
      const detail = (e as CustomEvent).detail;
      chrome.runtime
        .sendMessage({
          type: '__KONVA_DEVTOOLS__BROADCAST_RESULT',
          result: detail,
        })
        .catch(() => {});
      s.remove();
      requestDetectionCallback && requestDetectionCallback(detail);
    });

    // Poll for readiness
    // because we new setup the build script is module which imports another file
    // so we need to keep calling checkReady until the script is loaded
    const checkReady = () => {
      if (!shouldDetect) {
        return;
      }

      document.dispatchEvent(new CustomEvent('__KONVA_DEVTOOLS__DETECT_KONVA'));

      setTimeout(checkReady, 10);
    };

    s.onload = checkReady;
  } catch (error) {
    console.log(error);
  }
}

// listen for event sent from Popup page
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request['type'] === '__KONVA_DEVTOOLS__REQUEST_DETECTION') {
    detect(sendResponse);
  }
  return true; // this make sure sendResponse will work asynchronously
});
