import { convertFile, estimateTokens } from '../utils/converter.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Docs Tab States
  const stateDefault = document.getElementById('state-default');
  const stateConverting = document.getElementById('state-converting');
  const stateDone = document.getElementById('state-done');
  const stateError = document.getElementById('state-error');
  
  // Docs Tab Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  
  const convertingFilename = document.getElementById('converting-filename');
  const convertingProgress = document.getElementById('converting-progress');
  
  const doneOrigSize = document.getElementById('done-orig-size');
  const doneMdSize = document.getElementById('done-md-size');
  const doneTokensSaved = document.getElementById('done-tokens-saved');
  const donePreview = document.getElementById('done-preview');
  
  const btnPaste = document.getElementById('btn-paste');
  const btnCopy = document.getElementById('btn-copy');
  const btnRetry = document.getElementById('btn-retry');
  
  // Screenshots Tab Elements
  const badge = document.getElementById('screenshot-badge');
  const usageText = document.getElementById('usage-text');
  const usageProgress = document.getElementById('usage-progress');
  const upgradeCard = document.getElementById('upgrade-card');
  const historyItems = document.getElementById('history-items');
  
  // State variables
  let currentMarkdown = '';
  const MAX_SCREENSHOTS = 5;
  let screenshotsUsed = 0;
  let lastConversions = [];

  // 1. Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab') + '-tab';
      document.getElementById(tabId).classList.add('active');
    });
  });

  // 2. Load Data from Storage
  function loadData() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['screenshotsUsed', 'lastConversions'], (result) => {
        if (result.screenshotsUsed !== undefined) {
          screenshotsUsed = result.screenshotsUsed;
        }
        if (result.lastConversions !== undefined) {
          lastConversions = result.lastConversions;
        }
        updateScreenshotUI();
        renderHistory();
      });
    } else {
      updateScreenshotUI();
    }
  }

  function updateScreenshotUI() {
    badge.textContent = `${screenshotsUsed}/${MAX_SCREENSHOTS} used`;
    usageText.textContent = `${screenshotsUsed}/${MAX_SCREENSHOTS}`;
    usageProgress.style.width = `${(screenshotsUsed / MAX_SCREENSHOTS) * 100}%`;
    
    if (screenshotsUsed >= MAX_SCREENSHOTS) {
      badge.classList.add('limit-reached');
      usageProgress.style.backgroundColor = 'var(--red)';
      upgradeCard.style.display = 'flex';
    } else {
      badge.classList.remove('limit-reached');
      usageProgress.style.backgroundColor = 'var(--accent)';
      upgradeCard.style.display = 'none';
    }
  }

  function renderHistory() {
    if (!historyItems) return;
    
    if (lastConversions.length === 0) {
      historyItems.innerHTML = '<div class="text-muted text-center py-4">No recent conversions</div>';
      return;
    }

    historyItems.innerHTML = lastConversions.map(item => `
      <div class="history-item">
        <div class="history-item-left">
          <div class="history-filename">${item.filename}</div>
          <div class="history-time">${formatTime(item.timestamp)}</div>
        </div>
        <div class="history-tokens text-green">${item.tokensSaved}% saved</div>
      </div>
    `).join('');
  }

  function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hrs ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function saveConversion(filename, savings, type) {
    const newEntry = {
      filename,
      timestamp: Date.now(),
      tokensSaved: savings,
      type
    };

    lastConversions.unshift(newEntry);
    lastConversions = lastConversions.slice(0, 3);

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ lastConversions });
    }
    renderHistory();
  }

  // 3. Document Conversion Flow
  function showState(stateElement) {
    [stateDefault, stateConverting, stateDone, stateError].forEach(el => {
      el.classList.remove('active');
    });
    stateElement.classList.add('active');
  }

  // Handle Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.style.borderColor = 'var(--accent)';
      dropzone.style.backgroundColor = 'var(--surface2)';
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.style.borderColor = 'var(--border)';
      dropzone.style.backgroundColor = 'var(--surface)';
    }, false);
  });

  dropzone.addEventListener('drop', handleDrop, false);
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
  });

  function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles(files);
  }

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function handleFiles(files) {
    const file = files[0];
    if (!file) return;

    // Validate type (basic)
    const validExtensions = ['.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      showError("Invalid file type. Please upload a PDF or DOCX.");
      return;
    }

    startConversion(file);
  }

  async function startConversion(file) {
    showState(stateConverting);
    convertingFilename.textContent = file.name;
    convertingProgress.style.width = '30%';
    
    try {
      const result = await convertFile(file);
      convertingProgress.style.width = '100%';
      
      if (result.markdown) {
        finishConversion(file, result.markdown);
      } else if (result.isScanned) {
        showError("This PDF appears to be a scan. OCR is coming in V2!");
      } else {
        showError("Could not extract text from this file.");
      }
    } catch (err) {
      console.error("Conversion error:", err);
      showError("Error converting file: " + err.message);
    }
  }

  function finishConversion(file, markdown) {
    const origSizeStr = formatBytes(file.size);
    const mdSize = new Blob([markdown]).size;
    const mdSizeStr = formatBytes(mdSize);
    
    const savings = Math.round((1 - (mdSize / file.size)) * 100);
    const finalSavings = Math.max(0, savings);
    
    doneOrigSize.textContent = origSizeStr;
    doneMdSize.textContent = mdSizeStr;
    doneTokensSaved.textContent = `${finalSavings}%`;
    
    currentMarkdown = markdown;
    donePreview.textContent = markdown;
    
    saveConversion(file.name, finalSavings, file.name.split('.').pop());
    showState(stateDone);
  }

  function showError(msg) {
    document.getElementById('error-message').textContent = msg;
    showState(stateError);
  }

  btnRetry.addEventListener('click', () => {
    showState(stateDefault);
    fileInput.value = '';
  });

  // 4. Action Buttons
  function temporarilyChangeButtonText(btn, newText, originalText) {
    btn.textContent = newText;
    setTimeout(() => {
      btn.textContent = originalText;
    }, 1500);
  }

  btnPaste.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) {
          temporarilyChangeButtonText(btnPaste, 'Failed ❌ — no active tab', '⚡ Paste to Chat');
          return;
        }
        chrome.runtime.sendMessage({
          type: 'INJECT_MARKDOWN',
          text: currentMarkdown,
          tabId: tabs[0].id
        }, (response) => {
          if (response && response.success) {
            temporarilyChangeButtonText(btnPaste, 'Pasted! ✓', '⚡ Paste to Chat');
          } else {
            temporarilyChangeButtonText(btnPaste, 'Failed ❌ — click chatbox first', '⚡ Paste to Chat');
          }
        });
      });
    } else {
      console.log('Mock Inject Markdown:', currentMarkdown);
      temporarilyChangeButtonText(btnPaste, 'Pasted! ✓', '⚡ Paste to Chat');
    }
  });

  btnCopy.addEventListener('click', () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentMarkdown).then(() => {
        temporarilyChangeButtonText(btnCopy, 'Copied! ✓', 'Copy');
      }).catch(err => {
        console.error('Failed to copy', err);
      });
    } else {
      console.log('Clipboard API not available');
    }
  });

  // Init
  loadData();
});