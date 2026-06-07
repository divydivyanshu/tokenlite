export function getActiveSite() {
  return window.location.hostname;
}

export function getChatbox() {
  const hostname = getActiveSite();
  if (hostname.includes('claude.ai')) {
    return document.querySelector('.ProseMirror[contenteditable="true"]');
  } else if (hostname.includes('chatgpt.com')) {
    return document.querySelector('#prompt-textarea');
  } else if (hostname.includes('gemini.google.com')) {
    return document.querySelector('.ql-editor[contenteditable="true"]');
  } else if (hostname.includes('perplexity.ai')) {
    return document.querySelector('textarea[placeholder]');
  }
  return null;
}

export async function injectMarkdown(text) {
  const chatbox = getChatbox();
  if (!chatbox) return false;

  chatbox.focus();
  const hostname = getActiveSite();

  if (hostname.includes('claude.ai')) {
    // Claude: dispatch InputEvent('input', { data: text, inputType: 'insertText', bubbles: true })
    chatbox.dispatchEvent(new InputEvent('input', { 
      data: text, 
      inputType: 'insertText', 
      bubbles: true 
    }));
  } else if (hostname.includes('chatgpt.com')) {
    // ChatGPT: use Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set, then dispatch 'input' event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(chatbox, text);
    chatbox.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (hostname.includes('gemini.google.com')) {
    // Gemini: document.execCommand('insertText', false, text)
    document.execCommand('insertText', false, text);
  } else if (hostname.includes('perplexity.ai')) {
    // Perplexity: direct textarea.value = text, dispatch input + change events
    chatbox.value = text;
    chatbox.dispatchEvent(new Event('input', { bubbles: true }));
    chatbox.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return true;
}

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.innerText = message;
  
  let bgColor = '#333';
  if (type === 'info') bgColor = '#2196F3';
  else if (type === 'success') bgColor = '#4CAF50';
  else if (type === 'error') bgColor = '#f44336';
  else if (type === 'warning') bgColor = '#ff9800';

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    backgroundColor: bgColor,
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    opacity: '0',
    transform: 'translateY(20px)',
    pointerEvents: 'none'
  });

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}
