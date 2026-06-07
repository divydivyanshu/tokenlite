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
    // Check local limit first
    chrome.storage.local.get(['screenshotsUsed', 'lastConversions'], async (result) => {
      let used = result.screenshotsUsed || 0;
      let history = result.lastConversions || [];

      if (used >= 5) {
        sendResponse({ status: 'LIMIT_REACHED', remaining: 0 });
        return;
      }

      try {
        const response = await convertScreenshot(message.base64, message.mimeType);
        
        if (response.markdown) {
          // Increment local count until Session 12 backend integration
          used++;
          const tokensSaved = response.tokensSaved || 90; // Default estimate
          
          const newEntry = {
            filename: `screenshot_${new Date().getTime()}.png`,
            timestamp: Date.now(),
            tokensSaved: tokensSaved,
            type: 'png'
          };
          
          history.unshift(newEntry);
          history = history.slice(0, 3);

          await chrome.storage.local.set({ 
            screenshotsUsed: used,
            lastConversions: history
          });

          sendResponse({ 
            markdown: response.markdown, 
            tokensSaved: tokensSaved,
            remaining: 5 - used 
          });
        } else {
          sendResponse({ status: response.error || 'OCR_FAILED' });
        }
      } catch (err) {
        sendResponse({ status: 'OCR_FAILED', message: err.message });
      }
    });
    return true; 
  }

  if (message.type === 'INJECT_MARKDOWN') {
    const targetTabId = message.tabId || (sender.tab ? sender.tab.id : null);
    
    if (!targetTabId) {
      sendResponse({ success: false, error: 'No target tab found' });
      return false;
    }

    chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (text) => {
        const selectors = [
          '.ProseMirror[contenteditable="true"]',  // Claude
          '#prompt-textarea',                        // ChatGPT
          '.ql-editor[contenteditable="true"]',     // Gemini
          'textarea[placeholder]'                    // Perplexity
        ];
        let el = null;
        for (const s of selectors) {
          el = document.querySelector(s);
          if (el) break;
        }
        if (!el) return false;
        el.focus();
        document.execCommand('insertText', false, text);
        return true;
      },
      args: [message.text]
    }).then(results => {
      if (results && results[0] && results[0].result) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    }).catch(err => {
      console.error('Injection failed:', err);
      sendResponse({ success: false, error: err.message });
    });
    
    return true;
  }

  if (message.type === 'GET_UUID') {
    getOrCreateUUID().then(sendResponse);
    return true;
  }
});
