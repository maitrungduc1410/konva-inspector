import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === '__KONVA_DEVTOOLS__BROADCAST_RESULT') {
    chrome.action.setIcon({
      path: `../../../icon32${!message.result ? '_black' : ''}.png`,
      tabId: sender.tab.id,
    });
  }
});
