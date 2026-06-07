async function convertPDF(file) {
  // Load pdf.js with workerSrc pointing to lib/pdf.worker.min.js
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('lib/pdf.worker.min.js')
      : '/lib/pdf.worker.min.js';
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Extract text from all pages using pdfjsLib
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let markdown = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let lastY = null;
    let currentLine = '';
    let isHeading = false;
    
    for (const item of textContent.items) {
      if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
        if (isHeading) {
          markdown += '## ' + currentLine.trim() + '\n\n';
        } else {
          markdown += currentLine.trim() + '\n\n';
        }
        currentLine = '';
        isHeading = false;
      }
      
      currentLine += item.str;
      lastY = item.transform[5];
      
      // Basic heuristic: larger font size implies a heading
      if (item.transform[0] > 14) {
        isHeading = true;
      }
    }
    
    if (currentLine) {
      if (isHeading) {
        markdown += '## ' + currentLine.trim() + '\n\n';
      } else {
        markdown += currentLine.trim() + '\n\n';
      }
    }
  }

  const finalMarkdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  // If text is empty (scanned PDF): return null (caller will use OCR)
  if (!finalMarkdown) {
    return null;
  }

  return finalMarkdown;
}

async function convertDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use mammoth.convertToHtml({ arrayBuffer })
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  // Convert HTML to markdown using TurndownService
  const turndownService = new TurndownService();
  return turndownService.turndown(html);
}

async function convertFile(file) {
  const name = file.name.toLowerCase();
  const mime = file.type;
  
  let type = 'unknown';
  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    type = 'pdf';
  } else if (name.endsWith('.docx') || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    type = 'docx';
  } else if (name.endsWith('.txt') || mime.startsWith('text/')) {
    type = 'txt';
  }

  let markdown = null;
  let isScanned = false;

  if (type === 'pdf') {
    markdown = await convertPDF(file);
    if (!markdown) {
      isScanned = true;
    }
  } else if (type === 'docx') {
    markdown = await convertDOCX(file);
  } else if (type === 'txt') {
    markdown = await file.text();
  }

  return { markdown, type, isScanned };
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function estimateImageTokens() {
  return 1275;
}

export {
  convertFile,
  estimateTokens,
  estimateImageTokens
};
