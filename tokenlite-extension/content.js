function showToast(message, duration = 3000, actionLabel = null, actionCallback = null) {
  let toast = document.getElementById('tokenlite-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tokenlite-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '999999',
      backgroundColor: '#1E1E1E',
      color: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '280px',
      maxWidth: '400px'
    });
    document.body.appendChild(toast);
  }
  
  // Clear previous content
  toast.innerHTML = '';
  
  // Main message
  const messageEl = document.createElement('div');
  messageEl.style.padding = '12px 20px 8px';
  messageEl.style.flex = '1';
  messageEl.textContent = message;
  toast.appendChild(messageEl);
  
  // Action button (if provided)
  if (actionLabel && actionCallback) {
    const actionEl = document.createElement('button');
    actionEl.textContent = actionLabel;
    Object.assign(actionEl.style, {
      background: 'transparent',
      color: '#5B8CFF',
      border: 'none',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '8px 20px',
      textAlign: 'left',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      width: '100%',
      transition: 'background 0.2s'
    });
    actionEl.addEventListener('mouseenter', () => {
      actionEl.style.background = 'rgba(91, 140, 255, 0.1)';
    });
    actionEl.addEventListener('mouseleave', () => {
      actionEl.style.background = 'transparent';
    });
    actionEl.addEventListener('click', (e) => {
      e.preventDefault();
      actionCallback();
      // Close toast after action
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
    toast.appendChild(actionEl);
  }
  
  toast.style.opacity = '1';
  
  if (toast.hideTimeout) {
    clearTimeout(toast.hideTimeout);
  }
  
  // Auto-hide
  toast.hideTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

document.addEventListener('paste', async (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  let imageItem = null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      imageItem = items[i];
      break;
    }
  }

  // 2. If no image: return (let normal paste happen)
  if (!imageItem) {
    return;
  }

  // 3. If image found:
  // a. event.preventDefault()
  event.preventDefault();
  
  // b. Show toast: "⚡ Converting to markdown..."
  showToast("⚡ Converting to markdown...");

  try {
    const file = imageItem.getAsFile();
    if (!file) {
      showToast("❌ Conversion failed. Try again.", 3000);
      return;
    }

    const mimeType = file.type;
    
    // c. Convert image blob to base64
    const base64 = await blobToBase64(file);

    // d. Send message to background: { type: 'CONVERT_SCREENSHOT', base64, mimeType }
    const response = await chrome.runtime.sendMessage({ 
      type: 'CONVERT_SCREENSHOT', 
      base64, 
      mimeType 
    });

    if (!response) {
      showToast("❌ Conversion failed. Try again.", 3000);
      return;
    }

    // e. On response:
    if (response.markdown) {
      // If markdown: inject into chatbox, show toast with download option
      chrome.runtime.sendMessage({ type: 'INJECT_MARKDOWN', text: response.markdown });
      const tokensSaved = response.tokensSaved || 0;
      const remaining = response.remaining || 0;
      
      // Store markdown for download callback
      const markdownForDownload = response.markdown;
      
      // Show toast with download option
      showToast(
        `✓ Done — ~${tokensSaved} tokens saved (${remaining} remaining)`,
        5000,
        '↓ Download .md',
        () => {
          // Download the markdown file
          chrome.runtime.sendMessage({ 
            type: 'DOWNLOAD_MARKDOWN', 
            text: markdownForDownload 
          }, (downloadResponse) => {
            if (downloadResponse && downloadResponse.success) {
              showToast(`✓ Downloaded ${downloadResponse.filename}`, 3000);
            } else {
              showToast('❌ Download failed', 3000);
            }
          });
        }
      );
    } else if (response.status === 'LIMIT_REACHED') {
      showToast("🚫 5/5 screenshots used. TokenLite Pro coming soon!", 3000);
    } else if (response.status === 'OFFLINE') {
      showToast("⚠️ You're offline", 3000);
    } else if (response.status === 'GEMINI_QUOTA_EXCEEDED') {
      showToast("⚠️ Gemini API quota exceeded. Check billing or wait and try again.", 5000);
    } else if (response.status === 'OCR_FAILED') {
      showToast("❌ Conversion failed. Try again.", 3000);
    } else {
      showToast("❌ Conversion failed. Try again.", 3000);
    }
  } catch (err) {
    console.error("TokenLite: Error processing paste", err);
    showToast("❌ Conversion failed. Try again.", 3000);
  }
});
