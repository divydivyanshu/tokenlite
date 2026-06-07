import { convertScreenshot } from './utils/backend.js';
import { getOrCreateUUID } from './utils/uuid.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'onboarding/onboarding.html' });
    await getOrCreateUUID();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONVERT_SCREENSHOT') {
    convertScreenshot(message.base64, message.mimeType)
      .then(sendResponse)
      .catch(err => sendResponse({ error: 'OCR_FAILED', message: err.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'INJECT_MARKDOWN') {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    if (tabId) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: async (text) => {
          // Dynamic import of the inject utility
          const modulePath = chrome.runtime.getURL('utils/inject.js');
          const { injectMarkdown } = await import(modulePath);
          return await injectMarkdown(text);
        },
        args: [message.text]
      }).then(results => {
        if (results && results[0]) {
          sendResponse({ success: results[0].result });
        }
      }).catch(err => {
        console.error('Injection failed:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }
  }

  if (message.type === 'GET_UUID') {
    getOrCreateUUID().then(sendResponse);
    return true;
  }
});
