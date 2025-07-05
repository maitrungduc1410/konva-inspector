import 'webextension-polyfill';

console.log('Konva Inspector Background loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === '__KONVA_DEVTOOLS__BROADCAST_RESULT') {
    // Update extension icon based on whether Konva is detected
    chrome.action.setIcon({
      path: `icon32${!message.result ? '_black' : ''}.png`,
      tabId: sender.tab?.id,
    });
  }
});
