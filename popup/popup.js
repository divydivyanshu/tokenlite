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
  
  // State variables
  let currentMarkdown = '';
  const MAX_SCREENSHOTS = 5;
  let screenshotsUsed = 3; // Default

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

  // 2. Load Screenshot Count
  function loadScreenshotCount() {
    // In a real extension, this would come from chrome.storage or background
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['screenshotsUsed'], (result) => {
        if (result.screenshotsUsed !== undefined) {
          screenshotsUsed = result.screenshotsUsed;
          updateScreenshotUI();
        } else {
          updateScreenshotUI();
        }
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

  function startConversion(file) {
    showState(stateConverting);
    convertingFilename.textContent = file.name;
    convertingProgress.style.width = '0%';
    
    // Mock conversion process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      convertingProgress.style.width = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        finishConversion(file);
      }
    }, 150);
  }

  function finishConversion(file) {
    // Mock results
    const origSizeStr = formatBytes(file.size);
    // Let's pretend markdown is 5% of the original size
    const mockMdSize = Math.max(file.size * 0.05, 1024); 
    const mdSizeStr = formatBytes(mockMdSize);
    
    // Calculate mock savings
    const savings = Math.round((1 - (mockMdSize / file.size)) * 100) || 95;
    
    doneOrigSize.textContent = origSizeStr;
    doneMdSize.textContent = mdSizeStr;
    doneTokensSaved.textContent = `${savings}%`;
    
    currentMarkdown = `# Extracted content from ${file.name}\n\nThis is a mocked extracted text for demonstration.\nIn a real implementation, this would contain the actual parsed text from the document.\n\n- Point 1\n- Point 2\n- Point 3`;
    donePreview.textContent = currentMarkdown;
    
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
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ 
        type: 'INJECT_MARKDOWN', 
        text: currentMarkdown 
      });
    } else {
      console.log('Mock Inject Markdown:', currentMarkdown);
    }
    temporarilyChangeButtonText(btnPaste, 'Pasted! ✓', '⚡ Paste to Chat');
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
  loadScreenshotCount();
});