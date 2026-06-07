function showToast(message, duration = 3000) {
  let toast = document.getElementById('tokenlite-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tokenlite-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '999999',
      padding: '12px 20px',
      backgroundColor: '#1E1E1E',
      color: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'none'
    });
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.opacity = '1';
  
  if (toast.hideTimeout) {
    clearTimeout(toast.hideTimeout);
  }
  
  toast.hideTimeout = setTimeout(() => {
    toast.style.opacity = '0';
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
      showToast("❌ Conversion failed. Try again.");
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
      showToast("❌ Conversion failed. Try again.");
      return;
    }

    // e. On response:
    if (response.markdown) {
      // If markdown: inject into chatbox, show toast
      chrome.runtime.sendMessage({ type: 'INJECT_MARKDOWN', text: response.markdown });
      const tokensSaved = response.tokensSaved || 0;
      const remaining = response.remaining || 0;
      showToast(`✓ Done — ~${tokensSaved} tokens saved (${remaining} remaining)`);
    } else if (response.status === 'LIMIT_REACHED') {
      showToast("🚫 5/5 screenshots used. TokenLite Pro coming soon!");
    } else if (response.status === 'OFFLINE') {
      showToast("⚠️ You're offline");
    } else if (response.status === 'OCR_FAILED') {
      showToast("❌ Conversion failed. Try again.");
    } else {
      showToast("❌ Conversion failed. Try again.");
    }
  } catch (err) {
    console.error("TokenLite: Error processing paste", err);
    showToast("❌ Conversion failed. Try again.");
  }
});
