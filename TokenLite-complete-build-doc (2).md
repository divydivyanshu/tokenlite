# TokenLite — Complete V1 Build Document
> One source of truth. Read before every OpenCode session.

---

## 1. PRODUCT OVERVIEW

**Name:** TokenLite  
**Tagline:** "Paste smarter. Use less tokens."  
**Type:** Chrome Extension (Manifest V3)  
**Version:** 1.0 (private beta, no Chrome Store yet)  
**Distribution:** Share .crx file privately for testing

**What it does:**
- Intercepts screenshot paste (Ctrl+V) on LLM sites → converts to markdown automatically
- Converts PDF/DOCX via popup → markdown → paste to chat or copy
- Saves up to 90% input tokens per message

---

## 2. V1 SCOPE (HARD LIMITS — DO NOT ADD ANYTHING ELSE)

### ✅ IN V1
- Screenshot paste intercept → OCR via backend → markdown injection
- PDF/DOCX → local conversion (pdf.js + mammoth.js) → unlimited
- 5 free screenshots per UUID (no login)
- Popup: drag/drop PDF/DOCX → preview → Paste to Chat + Copy
- 3-slide onboarding on first install
- Supported sites: Claude.ai, ChatGPT, Gemini, Perplexity
- Error states: offline, password-protected PDF, limit reached
- Dark UI only

### ❌ NOT IN V1
- Login / Google OAuth
- User's own API key
- Payment / pricing plans
- Chrome Web Store listing
- Firefox support
- Analytics dashboard

---

## 3. USER FLOWS

### Flow A — Screenshot (Automatic)
```
User takes screenshot (Win+Shift+S)
→ Switches to Claude/ChatGPT/Gemini tab
→ Presses Ctrl+V
→ TokenLite intercepts clipboard image
→ Shows small toast: "Converting to markdown... ⚡"
→ Sends image to TokenLite backend (with UUID)
→ Backend calls OCR API → returns markdown
→ Markdown auto-typed into chatbox
→ Toast updates: "✓ Done — ~1,240 tokens saved"
→ Screenshot count: 3/5 used (shown in toast)
```

### Flow B — PDF/DOCX (Popup)
```
User opens LLM site tab
→ Clicks TokenLite icon (popup opens)
→ Drops PDF or DOCX into dropzone (or clicks to browse)
→ Extension converts locally (pdf.js / mammoth.js)
→ Shows markdown preview + stats (tokens saved, size reduction)
→ User clicks [Paste to Chat] → markdown injected into chatbox
→ OR clicks [Copy] → copies to clipboard
```

### Flow C — First Install (Onboarding)
```
User installs extension
→ Welcome tab opens automatically (chrome.tabs.create)
→ 3-slide onboarding (see Section 7)
→ Slide 3: "You're ready! Go to Claude or ChatGPT and paste a screenshot"
→ Done. No API key needed.
```

---

## 4. ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│           CHROME EXTENSION                  │
│                                             │
│  content.js → intercepts Ctrl+V paste       │
│  popup.js → handles PDF/DOCX conversion     │
│  background.js → message router             │
│  onboarding.html → first install page       │
│                                             │
│  LOCAL LIBRARIES:                           │
│  pdf.js → extract text from PDFs            │
│  mammoth.js → convert DOCX to HTML          │
│  turndown.js → HTML to markdown             │
└────────────────┬────────────────────────────┘
                 │ screenshot only (HTTPS)
                 ▼
┌─────────────────────────────────────────────┐
│           TOKENLITE BACKEND                 │
│           (Vercel Serverless)               │
│                                             │
│  POST /api/ocr                              │
│  - Receives: { image_base64, uuid }         │
│  - Checks: UUID screenshot count in DB      │
│  - If < 5: calls OCR API, returns markdown  │
│  - If >= 5: returns 403 limit reached       │
│  - Increments count in Turso             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           TURSO DATABASE                    │
│                                             │
│  Table: usage                               │
│  - uuid (text, primary key)                 │
│  - screenshot_count (int, default 0)        │
│  - created_at (timestamp)                   │
│  - last_used (timestamp)                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           OCR API (your key)                │
│           Gemini Flash / Groq Vision        │
└─────────────────────────────────────────────┘
```

---

## 5. FILE STRUCTURE

```
tokenlite-extension/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── onboarding/
│   ├── onboarding.html
│   ├── onboarding.js
│   └── onboarding.css
├── options/
│   ├── options.html
│   └── options.js
├── lib/
│   ├── pdf.min.js
│   ├── pdf.worker.min.js
│   ├── mammoth.browser.min.js
│   └── turndown.js
├── utils/
│   ├── uuid.js
│   ├── backend.js
│   ├── converter.js
│   └── inject.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

tokenlite-backend/
├── api/
│   └── ocr.js          (Vercel serverless function)
├── lib/
│   └── turso.js
├── package.json
└── vercel.json
```

---

## 6. MANIFEST.JSON

```json
{
  "manifest_version": 3,
  "name": "TokenLite",
  "version": "1.0.0",
  "description": "Paste smarter. Convert screenshots and docs to markdown — use less tokens on any AI.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "clipboardRead",
    "clipboardWrite"
  ],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://YOUR-BACKEND.vercel.app/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://claude.ai/*",
        "https://chatgpt.com/*",
        "https://gemini.google.com/*",
        "https://www.perplexity.ai/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options/options.html"
}
```

---

## 7. ONBOARDING — 3 SLIDES SPEC

**Slide 1: What is TokenLite?**
- Headline: "Stop wasting tokens on screenshots"
- Visual: before/after — image (1,275 tokens) vs markdown text (85 tokens)
- Stat: "Up to 93% fewer tokens per message"
- CTA: "Next →"

**Slide 2: How it works**
- 3 icons in a row:
  1. 📸 Take screenshot
  2. ⚡ Ctrl+V as usual (TokenLite converts automatically)
  3. ✅ Markdown in your chatbox
- Below: "PDFs and docs? Drop them in the popup anytime."
- CTA: "Next →"

**Slide 3: You're ready**
- Headline: "You have 5 free screenshot conversions"
- Sub: "PDF and doc conversions are always unlimited and free."
- Note: "More screenshots coming soon with TokenLite Pro"
- CTA: "Start using TokenLite →" (closes tab, opens chatgpt.com)

---

## 8. ERROR STATES

| Error | What user sees |
|---|---|
| Offline | Toast: "⚠️ You're offline. Check connection." |
| Password-protected PDF | Popup: "🔒 This PDF is password protected. Remove password first." |
| Screenshot limit reached | Toast: "You've used all 5 free screenshots. TokenLite Pro coming soon!" |
| OCR API error | Toast: "Conversion failed. Try again." |
| Unsupported file type | Popup: "Only PDF and DOCX supported." |
| Site chatbox not found | Toast: "Could not find chatbox. Try clicking the input first." |

---

## 9. CHATBOX SELECTORS PER SITE

```javascript
const SELECTORS = {
  'claude.ai': '.ProseMirror[contenteditable="true"]',
  'chatgpt.com': '#prompt-textarea',
  'gemini.google.com': '.ql-editor[contenteditable="true"]',
  'perplexity.ai': 'textarea[placeholder]'
};
```

**Injection method per site:**
- Claude (ProseMirror): dispatch InputEvent with data
- ChatGPT (React textarea): use nativeInputValueSetter + React onChange trigger
- Gemini (Quill editor): use Quill API or execCommand insertText
- Perplexity (textarea): direct value set + input event dispatch

---

## 10. TURSO SCHEMA

```sql
-- Run in Turso CLI: turso db shell tokenlite

CREATE TABLE IF NOT EXISTS usage (
  uuid TEXT PRIMARY KEY,
  screenshot_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT DEFAULT (datetime('now'))
);
```

**Setup commands:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create tokenlite
turso db show tokenlite --url      # → TURSO_DATABASE_URL
turso db tokens create tokenlite   # → TURSO_AUTH_TOKEN
turso db shell tokenlite           # then paste CREATE TABLE above
```

**lib/turso.js:**
```javascript
import { createClient } from '@libsql/client';
export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

---

## 11. BACKEND API SPEC

### POST /api/ocr

**Request:**
```json
{
  "image_base64": "data:image/png;base64,...",
  "mime_type": "image/png",
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (success):**
```json
{
  "markdown": "## Report Q4...\n\n| Column | Value |...",
  "screenshots_used": 3,
  "screenshots_remaining": 2
}
```

**Response (limit reached):**
```json
{
  "error": "LIMIT_REACHED",
  "screenshots_used": 5,
  "screenshots_remaining": 0
}
```

**Response (offline/error):**
```json
{
  "error": "OCR_FAILED",
  "message": "Conversion failed. Try again."
}
```

---

## 12. OPENCODE SESSION PROMPTS (IN ORDER)

---

### SESSION 1 — Project scaffold

```
Create two project folders:

1. tokenlite-extension/ — Chrome MV3 extension
2. tokenlite-backend/ — Vercel serverless API

For extension, create exact file structure:
- manifest.json (use spec from build doc)
- background.js (empty)
- content.js (empty)
- popup/popup.html, popup.js, popup.css (empty)
- onboarding/onboarding.html, onboarding.js, onboarding.css (empty)
- options/options.html, options.js (empty)
- utils/uuid.js, backend.js, converter.js, inject.js (empty)
- lib/ folder (empty, for libraries)
- icons/ folder (placeholder PNGs, 16x16, 48x48, 128x128 — solid blue squares for now)

For backend, create:
- api/ocr.js (empty serverless function)
- lib/turso.js (empty)
- package.json with dependencies: @libsql/client
- vercel.json

Fill manifest.json with the exact spec. Replace YOUR-BACKEND with placeholder.
```

---

### SESSION 2 — UUID generator

```
Build utils/uuid.js for Chrome MV3 extension.

Function: async getOrCreateUUID()
- Check chrome.storage.local for existing 'tokenlite_uuid'
- If exists: return it
- If not: generate UUID using crypto.randomUUID()
- Save to chrome.storage.local
- Return UUID

Export: { getOrCreateUUID }
```

---

### SESSION 3 — Turso + Backend setup

```
Build tokenlite-backend:

1. lib/turso.js:
- Initialize Turso client using env vars: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
- Use @libsql/client package
- Export: { turso }

2. api/ocr.js (Vercel serverless):
- Accept POST request only
- Parse body: { image_base64, mime_type, uuid }
- Validate: uuid required, image_base64 required
- Check current count: SELECT screenshot_count FROM usage WHERE uuid = ?
- If count >= 5: return 403 { error: 'LIMIT_REACHED', screenshots_used: 5, screenshots_remaining: 0 }
- Call Gemini Flash API with image (use env var GEMINI_API_KEY)
  - Model: gemini-1.5-flash
  - Prompt: "Extract all text from this image. Format as clean markdown. Preserve tables, headings, bullet lists. Return only markdown, no explanation or preamble."
- Upsert + increment count in Turso using INSERT ... ON CONFLICT
- Return 200 { markdown, screenshots_used, screenshots_remaining }
- Handle errors: API failure, DB failure, invalid input

4. vercel.json:
{
  "functions": {
    "api/ocr.js": { "maxDuration": 30 }
  }
}
```

---

### SESSION 4 — Local converter (PDF + DOCX)

```
Build utils/converter.js for Chrome extension.

Download these libraries into lib/ folder:
- pdf.js: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
- pdf.worker: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
- mammoth: https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js
- turndown: https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js

Functions:

1. async convertPDF(file) → string (markdown)
   - Load pdf.js with workerSrc pointing to lib/pdf.worker.min.js
   - Read file as ArrayBuffer
   - Extract text from all pages using pdfjsLib
   - If text is empty (scanned PDF): return null (caller will use OCR)
   - Format extracted text as markdown (headings, paragraphs)
   - Return markdown string

2. async convertDOCX(file) → string (markdown)
   - Use mammoth.convertToHtml({ arrayBuffer })
   - Convert HTML to markdown using TurndownService
   - Return markdown string

3. async convertFile(file) → { markdown, type, isScanned }
   - Detect file type by extension/mime
   - PDF → convertPDF → if null, set isScanned: true
   - DOCX → convertDOCX
   - Return result object

4. estimateTokens(text) → number
   - Return Math.ceil(text.length / 4)

5. estimateImageTokens() → number
   - Return 1275 (standard screenshot token estimate)

Export: { convertFile, estimateTokens, estimateImageTokens }
```

---

### SESSION 5 — Chatbox injector

```
Build utils/inject.js for Chrome extension content script.

Functions:

1. getActiveSite() → string
   - Return hostname: 'claude.ai', 'chatgpt.com', etc.

2. getChatbox() → Element | null
   - Selectors:
     claude.ai → '.ProseMirror[contenteditable="true"]'
     chatgpt.com → '#prompt-textarea'
     gemini.google.com → '.ql-editor[contenteditable="true"]'
     perplexity.ai → 'textarea[placeholder]'
   - Return element or null

3. async injectMarkdown(text) → boolean
   - Get chatbox element
   - If null: return false
   - Focus element
   - Site-specific injection:
     Claude: dispatch InputEvent('input', { data: text, inputType: 'insertText', bubbles: true })
     ChatGPT: use Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set, then dispatch 'input' event
     Gemini: document.execCommand('insertText', false, text)
     Perplexity: direct textarea.value = text, dispatch input + change events
   - Return true on success

4. showToast(message, type = 'info', duration = 3000)
   - Inject small floating toast div into page
   - Types: 'info' (blue), 'success' (green), 'error' (red), 'warning' (yellow)
   - Auto-remove after duration ms
   - Style: fixed bottom-right, z-index 999999, dark background, rounded
   - No external CSS — all inline styles

Export: { getChatbox, injectMarkdown, showToast }
```

---

### SESSION 6 — Backend caller

```
Build utils/backend.js for Chrome extension.

BACKEND_URL constant = 'https://YOUR-BACKEND.vercel.app'

Functions:

1. async convertScreenshot(imageBase64, mimeType) → { markdown, screenshots_used, screenshots_remaining } | { error }
   - Get UUID from utils/uuid.js
   - POST to BACKEND_URL/api/ocr
   - Body: { image_base64: imageBase64, mime_type: mimeType, uuid }
   - Handle responses:
     200 → return { markdown, screenshots_used, screenshots_remaining }
     403 → return { error: 'LIMIT_REACHED', screenshots_used: 5, screenshots_remaining: 0 }
     other → return { error: 'OCR_FAILED' }
   - Handle network error (offline) → return { error: 'OFFLINE' }

2. async getScreenshotCount() → number
   - GET BACKEND_URL/api/usage?uuid=xxx
   - Return count or 0 on error

Export: { convertScreenshot, getScreenshotCount }
```

---

### SESSION 7 — Content script (paste interceptor)

```
Build content.js for Chrome MV3 extension.

This runs on claude.ai, chatgpt.com, gemini.google.com, perplexity.ai.

DO NOT import external scripts. Use chrome.runtime.sendMessage for all utility calls.

Logic:

document.addEventListener('paste', async (event) => {
  1. Check clipboard items for image type
  2. If no image: return (let normal paste happen)
  3. If image found:
     a. event.preventDefault()
     b. Show toast: "⚡ Converting to markdown..."
     c. Convert image blob to base64
     d. Send message to background: { type: 'CONVERT_SCREENSHOT', base64, mimeType }
     e. On response:
        - If markdown: inject into chatbox, show toast "✓ Done — ~X tokens saved (Y remaining)"
        - If LIMIT_REACHED: show toast "🚫 5/5 screenshots used. TokenLite Pro coming soon!"
        - If OFFLINE: show toast "⚠️ You're offline"
        - If OCR_FAILED: show toast "❌ Conversion failed. Try again."
});

Toast injection: inline function, no imports, fixed bottom-right, z-index 999999.
Chatbox injection: send message to background → background executes script.
```

---

### SESSION 8 — Background service worker

```
Build background.js for Chrome MV3 extension.

Handle chrome.runtime.onMessage:

1. Type 'CONVERT_SCREENSHOT':
   - Import utils/backend.js (use importScripts)
   - Call convertScreenshot(base64, mimeType)
   - Return result to sender

2. Type 'INJECT_MARKDOWN':
   - Use chrome.scripting.executeScript to run inject.js on active tab
   - Call injectMarkdown(text) in injected script
   - Return success/failure

3. Type 'GET_UUID':
   - Import utils/uuid.js
   - Return UUID

On first install (chrome.runtime.onInstalled):
- Open onboarding page: chrome.tabs.create({ url: 'onboarding/onboarding.html' })
- Generate and store UUID
```

---

### SESSION 9 — Popup UI

```
Build popup/popup.html, popup.css, popup.js.

Design system:
  --bg: #0A0A0A
  --surface: #141414
  --surface2: #1E1E1E
  --border: #2A2A2A
  --accent: #4F8EF7
  --green: #22C55E
  --red: #EF4444
  --yellow: #F59E0B
  --text: #F0F0F0
  --muted: #666

Font: 'Space Mono' from Google Fonts (monospace, techy feel)
Width: 380px, min-height: 480px

UI SECTIONS:

1. Header (sticky)
   - Left: ⚡ TokenLite (logo + name)
   - Right: Screenshot count badge "3/5 used" (red if 5/5)

2. Tab bar: [Screenshots] [Docs]
   - Default: Docs tab active

3. DOCS TAB:
   - Drop zone (dashed, rounded-xl)
     Icon + "Drop PDF or DOCX here"
     Sub: "Click to browse · Unlimited & free"
   - On file drop/select → show converting state
   - Converting: progress bar + "Extracting text..."
   - Done: 
     Stats row: original size → markdown size, tokens saved %
     Preview box (monospace, 5 lines, scrollable)
     Two buttons: [⚡ Paste to Chat] [Copy]

4. SCREENSHOTS TAB:
   - Usage bar: 3/5 screenshots used (progress bar)
   - Instruction card: 
     "Just press Ctrl+V on any AI site"
     "TokenLite intercepts automatically"
   - Last 3 conversions list (filename, time, tokens saved)
   - If 5/5: upgrade card "Upgrade to Pro for unlimited"

STATES (JS):
- DEFAULT: show dropzone
- CONVERTING: hide dropzone, show progress + filename
- DONE: show stats + preview + buttons
- ERROR: show error message + retry button

[Paste to Chat] button:
- Send message to background: { type: 'INJECT_MARKDOWN', text: markdown }
- Show "Pasted! ✓" for 1.5s

[Copy] button:
- navigator.clipboard.writeText(markdown)
- Show "Copied! ✓" for 1.5s

Load screenshot count on popup open via chrome.storage or backend.
```

---

### SESSION 10 — Onboarding page

```
Build onboarding/onboarding.html, onboarding.css, onboarding.js.

3-slide full-page onboarding. Dark theme, same design tokens as popup.
Full viewport. Centered content. Max-width 600px.

SLIDE 1 — "Stop wasting tokens"
Visual: Two cards side by side
  Left: "📸 Screenshot" → "~1,275 tokens" (red badge)
  Right: "📄 Markdown" → "~85 tokens" (green badge)
Headline: "Stop wasting tokens on screenshots"
Sub: "TokenLite converts images and docs to markdown before they reach the AI."
CTA: [Get Started →]

SLIDE 2 — "Embarrassingly simple"
3 steps horizontally:
  1. 📸 Take a screenshot
  2. Ctrl+V (as always)  
  3. ✅ Markdown in chatbox
Below: "PDFs & DOCX? Drop them in the popup. Unlimited. Free."
CTA: [Next →]

SLIDE 3 — "You're ready"
Icon: ⚡ (large, accent color)
Headline: "5 free screenshot conversions included"
Sub: "Docs and PDFs are always unlimited."
Note (muted): "TokenLite Pro with unlimited screenshots — coming soon."
CTA: [Start Using TokenLite →]
  → On click: chrome.tabs.create({ url: 'https://claude.ai' }) + window.close()

JS: Slide transitions with CSS opacity + translateX animation.
Progress dots at bottom (3 dots, active = filled).
```

---

### SESSION 11 — Download libraries

```
Download these library files into tokenlite-extension/lib/:

1. https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js → lib/pdf.min.js
2. https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js → lib/pdf.worker.min.js
3. https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js → lib/mammoth.browser.min.js
4. https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js → lib/turndown.min.js

Use fetch or curl to download each file.
Verify file sizes > 0 after download.
```

---

### SESSION 12 — Env setup + deploy backend

```
Deploy tokenlite-backend to Vercel:

0. Accounts needed before this session:
   - turso.tech → DB already created (Session 3)
   - aistudio.google.com → copy Gemini API key
   - vercel.com → already connected to GitHub

1. Create .env.local with:
   TURSO_DATABASE_URL=your_turso_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   GEMINI_API_KEY=your_gemini_api_key

2. Add env vars to Vercel dashboard

3. Run in Turso CLI or dashboard:
CREATE TABLE usage (
  uuid TEXT PRIMARY KEY,
  screenshot_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT DEFAULT (datetime('now'))
);

4. Deploy: vercel --prod

5. Copy deployed URL → update BACKEND_URL in utils/backend.js
6. Add deployed URL to manifest.json host_permissions
```

---

### SESSION 13 — Testing checklist

```
Test TokenLite on each site. Fix issues found.

FLOW A — Screenshot paste:
□ claude.ai — Ctrl+V screenshot → markdown injected into ProseMirror
□ chatgpt.com — Ctrl+V screenshot → markdown injected into React textarea
□ gemini.google.com — Ctrl+V screenshot → markdown injected
□ perplexity.ai — Ctrl+V screenshot → markdown injected
□ 5th screenshot → LIMIT_REACHED toast shown
□ 6th screenshot → blocked, toast shown
□ Offline → offline toast shown

FLOW B — PDF/DOCX popup:
□ Text PDF dropped → extracted + preview shown
□ Scanned PDF dropped → isScanned message shown (OCR path for V2)
□ Password PDF → error shown
□ DOCX dropped → converted + preview shown
□ [Paste to Chat] → injected into active tab chatbox
□ [Copy] → clipboard copied

ONBOARDING:
□ Fresh install → onboarding tab opens
□ 3 slides navigate correctly
□ Slide 3 CTA opens claude.ai

ERRORS:
□ All error toasts display correctly
□ No console errors on any site

Known issues to watch:
- ProseMirror (Claude): may need custom InputEvent dispatch
- ChatGPT React: need nativeInputValueSetter trick
- CSP headers: check network tab for blocked requests
```

---

### SESSION 14 — Package for testing

```
Package TokenLite extension for distribution:

1. Create zip: zip -r TokenLite-v1.0.zip tokenlite-extension/ --exclude "*.DS_Store"

2. Write INSTALL.md:
   # How to install TokenLite (Developer Mode)
   1. Download TokenLite-v1.0.zip and unzip
   2. Open Chrome → go to chrome://extensions
   3. Enable "Developer mode" (top right toggle)
   4. Click "Load unpacked"
   5. Select the tokenlite-extension/ folder
   6. Pin TokenLite to toolbar
   7. Go to claude.ai or ChatGPT and take a screenshot!

3. Write README.md with:
   - What it does
   - How to use (Flow A + Flow B)
   - Known limitations (5 screenshots, no scanned PDF OCR)
   - Feedback: [your email or WhatsApp number]
```

---

## 13. V2 ROADMAP (after feedback)

- Google OAuth login
- Stripe payment + plans (Starter: 50/mo, Pro: unlimited)
- Chrome Web Store listing
- Scanned PDF OCR via backend
- More sites: Mistral, Grok, Copilot
- Firefox port
- Token savings dashboard
- Team/workspace plans
