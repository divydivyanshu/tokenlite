# TokenLite — Project Memory & Knowledge Base
> Paste this as the first message or system prompt in your Claude Project.
> Last updated: May 2026 | Version: 1.0 (Private Beta)

---

## 1. WHO I AM

- **Name:** Divyanshu
- **Location:** Delhi, India
- **Role:** Founder (Zunkk — AI email agent) + employed at EAZYBE SOFTWARE
- **Skills:** Product-oriented, some coding knowledge, using OpenCode (AI coding agent like Claude Code) to build
- **Preference:** Short, to-the-point answers. No big paragraphs. Think deep, answer short.

---

## 2. WHAT WE ARE BUILDING

**Product Name:** TokenLite
**Tagline:** "Paste smarter. Use less tokens."
**Type:** Chrome Extension (Manifest V3)
**Stage:** Pre-build. All decisions made. Ready to start coding.

**Core Problem:**
Every time a user pastes a screenshot or attaches a PDF/doc to Claude, ChatGPT, or any LLM — it consumes massive tokens. A single screenshot = ~1,275 tokens. The same content as markdown = ~85 tokens. TokenLite intercepts this and auto-converts to markdown before it reaches the LLM.

**Core Value:** Up to 93% fewer tokens per message. Zero extra steps for user.

---

## 3. ALL DECISIONS MADE (DO NOT RE-DISCUSS)

| Decision | Choice |
|---|---|
| Product type | Chrome Extension MV3 |
| Name | TokenLite |
| OCR for screenshots | Backend (Gemini Flash API — your key) |
| PDF/DOCX conversion | Local in browser (pdf.js + mammoth.js) — free, unlimited |
| User identification | UUID generated on install, stored in chrome.storage.local |
| Screenshot limit | 5 free per UUID (no login in V1) |
| Auth/Login | NOT in V1. V2 feature. |
| User's own API key | NOT in V1. V2 feature. |
| Pricing/payments | NOT in V1. V2 feature. |
| Backend hosting | Vercel (serverless) |
| Database | Turso |
| Analytics | NOT in V1 — V2 only |
| Distribution | Private .zip/crx to friends first. Chrome Store later (between V1 and V2). |
| UI style | Dark theme only |
| Onboarding | 3 slides on first install |
| Supported sites | Claude.ai, ChatGPT, Gemini, Perplexity |
| Version control | GitHub (private repo) |

---

## 4. V1 SCOPE — HARD LIMITS

### ✅ IN V1
- Screenshot Ctrl+V intercept → OCR via backend → auto-inject markdown into chatbox
- PDF/DOCX popup → local convert → preview → [Paste to Chat] + [Copy to Clipboard]
- 5 free screenshots per UUID
- 3-slide onboarding on first install
- Error handling: offline, password PDF, limit reached, OCR failed
- Dark UI with Space Mono font
- Supported: Claude.ai, ChatGPT, Gemini, Perplexity

### ❌ NOT IN V1
- Login / Google OAuth
- User's own API key
- Payment / pricing plans
- Chrome Web Store listing
- Firefox support
- Scanned PDF OCR (text PDFs only in V1)
- Analytics dashboard for users

---

## 5. USER FLOWS

### Flow A — Screenshot (Fully Automatic)
```
User takes screenshot (Win+Shift+S)
→ Switches to Claude/ChatGPT tab
→ Presses Ctrl+V (as normal)
→ TokenLite intercepts clipboard image
→ Toast: "⚡ Converting to markdown..."
→ Sends image + UUID to backend
→ Backend checks limit → calls Gemini OCR → returns markdown
→ Markdown auto-typed into chatbox
→ Toast: "✓ Done — ~1,240 tokens saved (3/5 remaining)"
```

### Flow B — PDF/DOCX (Popup)
```
User clicks TokenLite icon → popup opens
→ Drops PDF or DOCX into dropzone
→ Local conversion (pdf.js / mammoth.js)
→ Markdown preview + token savings shown
→ [Paste to Chat] → injected into active chatbox
→ [Copy] → copied to clipboard
```

### Flow C — First Install
```
Extension installed
→ Welcome tab auto-opens (chrome.tabs.create)
→ 3-slide onboarding
→ Slide 3 CTA → opens claude.ai
```

---

## 6. ARCHITECTURE

```
EXTENSION (Chrome MV3)
├── content.js → intercepts Ctrl+V on LLM sites
├── popup.js → handles PDF/DOCX conversion
├── background.js → message router + first install handler
├── onboarding.html → 3-slide welcome
└── LOCAL LIBS: pdf.js, mammoth.js, turndown.js

BACKEND (Vercel Serverless)
└── POST /api/ocr
    - Receives: { image_base64, mime_type, uuid }
    - Checks Turso: uuid screenshot count
    - If < 5: calls Gemini Flash API → returns markdown
    - If >= 5: returns 403 LIMIT_REACHED
    - Increments count in Turso

DATABASE (Turso)
└── Table: usage
    - uuid (PK), screenshot_count, created_at, last_used
```

---

## 7. FILE STRUCTURE

```
tokenlite-extension/
├── manifest.json
├── background.js
├── content.js
├── popup/ (popup.html, popup.js, popup.css)
├── onboarding/ (onboarding.html, onboarding.js, onboarding.css)
├── options/ (options.html, options.js)
├── lib/ (pdf.min.js, pdf.worker.min.js, mammoth.browser.min.js, turndown.js)
├── utils/ (uuid.js, backend.js, converter.js, inject.js)
└── icons/ (icon16.png, icon48.png, icon128.png)

tokenlite-backend/
├── api/ocr.js
├── lib/turso.js
├── package.json
└── vercel.json
```

---

## 8. CHATBOX SELECTORS

```javascript
const SELECTORS = {
  'claude.ai': '.ProseMirror[contenteditable="true"]',
  'chatgpt.com': '#prompt-textarea',
  'gemini.google.com': '.ql-editor[contenteditable="true"]',
  'perplexity.ai': 'textarea[placeholder]'
};
```

**Injection methods:**
- Claude → dispatch InputEvent (ProseMirror)
- ChatGPT → nativeInputValueSetter + React onChange trigger
- Gemini → execCommand('insertText')
- Perplexity → direct value set + input/change event dispatch

---

## 9. TECH STACK

| Layer | Tool | Cost |
|---|---|---|
| Extension | Chrome MV3, Vanilla JS | Free |
| PDF extraction | pdf.js (Mozilla) | Free |
| DOCX conversion | mammoth.js | Free |
| HTML→Markdown | turndown.js | Free |
| OCR API | Gemini Flash (your key) | ~Free (15 RPM, 1500 RPD on 1.5 Flash) |
| Backend | Vercel serverless | Free |
| Database | Turso | Free |
| Analytics | V2 only (PostHog) | — |
| Version control | GitHub | Free |
| Build tool | OpenCode (AI coding agent) | Free |

**Total V1 cost: $0** (until scale)

---

## 10. DESIGN SYSTEM

```css
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

Font: Space Mono (Google Fonts) — monospace, techy
Popup width: 380px
Dark mode only
```

---

## 11. ERROR STATES

| Error | User sees |
|---|---|
| Offline | Toast: "⚠️ You're offline. Check connection." |
| Password PDF | Popup: "🔒 PDF is password protected. Remove password first." |
| Screenshot limit | Toast: "🚫 5/5 screenshots used. TokenLite Pro coming soon!" |
| OCR failed | Toast: "❌ Conversion failed. Try again." |
| Wrong file type | Popup: "Only PDF and DOCX supported." |
| Chatbox not found | Toast: "Could not find chatbox. Click the input first." |

---

## 12. TURSO SCHEMA

```sql
-- Run: turso db shell tokenlite
CREATE TABLE IF NOT EXISTS usage (
  uuid TEXT PRIMARY KEY,
  screenshot_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT DEFAULT (datetime('now'))
);
```

**Setup:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create tokenlite
turso db show tokenlite --url     # TURSO_DATABASE_URL
turso db tokens create tokenlite  # TURSO_AUTH_TOKEN
```

---

## 13. BACKEND API

### POST /api/ocr
```
Request:  { image_base64, mime_type, uuid }
Response (success): { markdown, screenshots_used, screenshots_remaining }
Response (limit):   { error: 'LIMIT_REACHED', screenshots_used: 5, screenshots_remaining: 0 }
Response (error):   { error: 'OCR_FAILED', message: '...' }
```

### ENV VARS needed:
```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
GEMINI_API_KEY=
```

---

## 14. OPENCODE BUILD ORDER (14 Sessions)

| Session | What gets built |
|---|---|
| 1 | Project scaffold (both folders, all empty files) |
| 2 | utils/uuid.js — generate + store UUID |
| 3 | Backend: Turso + Vercel OCR endpoint |
| 4 | utils/converter.js — pdf.js + mammoth + turndown |
| 5 | utils/inject.js — chatbox detection + markdown injection + toasts |
| 6 | utils/backend.js — call backend, handle responses |
| 7 | content.js — paste interceptor |
| 8 | background.js — message router + onInstalled handler |
| 9 | Popup UI — 3 states (default/converting/done) + tabs |
| 10 | Onboarding — 3 slides |
| 11 | Download libraries into lib/ |
| 12 | Deploy backend to Vercel + Turso setup |
| 13 | Testing on all 4 sites + fixes |
| 14 | Package .zip + INSTALL.md for friends |

---

## 15. KNOWN HARD PROBLEMS

| Problem | Solution |
|---|---|
| Claude ProseMirror won't accept execCommand | Use InputEvent dispatch |
| ChatGPT React controlled input | nativeInputValueSetter trick |
| CSP blocks fetch to backend | Add to manifest host_permissions |
| pdf.js worker path in extension | Set workerSrc to extension URL |
| UUID abuse (reinstall = new UUID) | Acceptable for V1 |

---

## 16. ONBOARDING SLIDES

**Slide 1:** Before/after token comparison. Screenshot = 1,275 tokens. Markdown = 85 tokens.
**Slide 2:** 3-step flow: Take screenshot → Ctrl+V → Markdown in chatbox.
**Slide 3:** "5 free screenshots included. PDFs unlimited. TokenLite Pro coming soon."

---

## 17. COMPETITOR LANDSCAPE

| Tool | Gap |
|---|---|
| moar.ai | PDFs/docs only. No screenshot paste intercept. |
| RedactChat | PII-focused, not token optimization |
| Screenshot-to-AI extensions | Send to their own AI backend, not user's chosen LLM |

**TokenLite gap:** Only tool that handles BOTH screenshot paste intercept AND file conversion in one Chrome extension. Fully automatic for screenshots.

---

## 18. CHROME WEB STORE — WHEN READY

- **Cost:** $5 one-time developer fee
- **Review time:** 1-3 business days
- **Required:** Privacy policy URL (clipboard access = mandatory disclosure)
- **Assets needed:** Screenshots (1280x800), 128px icon, description, promo banner
- **Timeline:** Between V1 (private beta) and V2 (paid plans)

---

## 19. V2 ROADMAP (do not build now)

- Google OAuth login
- Stripe payments + plans (Starter: 50 screenshots/mo, Pro: unlimited)
- Chrome Web Store listing
- Scanned PDF OCR
- More sites: Mistral, Grok, Copilot, etc.
- Firefox port
- Token savings dashboard
- Team/workspace plans

---

## 20. HOW TO USE THIS DOC

- **Starting OpenCode session:** Paste relevant sections (architecture + session prompt)
- **Asking Claude questions:** Reference section numbers ("re: Section 8 — injection method for Claude")
- **After each session:** Update this doc with what changed
- **Git commits:** One per OpenCode session. Tag working builds.

---

## CURRENT STATUS

- [x] Idea validated
- [x] All product decisions made
- [x] Architecture designed
- [x] All 14 OpenCode prompts written (see TokenLite-complete-build-doc.md)
- [x] UI design prompt written (see extension-ui-prompt.md)
- [ ] GitHub repo created
- [ ] Turso database created (turso db create tokenlite)
- [ ] Vercel project created
- [ ] Gemini API key obtained
- [ ] OpenCode Session 1 started

---

## 21. ZERO-TO-SHIP WORKFLOW

### PHASE 0 — Setup (1 day)
```
1. GitHub → create private repo: tokenlite-extension + tokenlite-backend
2. Branching strategy:
   main       → production only
   dev        → active development
   feature/xx → each new feature
3. Vercel → connect GitHub → auto-deploys on push to main
4. Turso → create DB → run schema SQL```

### PHASE 1 — Build (14 OpenCode sessions)
```
Rule: one feature per session. Test before next session.
Commit to Git after every working session.
Vague prompt = hallucination. Specific prompt = good output.
```

### PHASE 2 — Testing (2-3 days)
```
Day 1: Flow A — screenshot paste on all 4 sites
Day 2: Flow B — PDF/DOCX popup
Day 3: Onboarding + all error states
Rule: never polish UI before core works
```

### PHASE 3 — Version Control (Git tags)
```
v0.1.0 → first screenshot works on any site
v0.2.0 → PDF/DOCX popup works
v0.3.0 → all 4 sites working
v1.0.0 → share .zip with friends

Commit message format:
feat: screenshot paste intercept on claude.ai
fix: ChatGPT React input injection
chore: update backend URL
```

### PHASE 4 — Analytics
```
Analytics NOT in V1. Will add PostHog in V2 after shipping.
```

### PHASE 5 — Feedback loop
```
1. Share .zip to 5-10 friends via WhatsApp
2. Create WhatsApp group for feedback
3. Weekly: collect issues → fix → new .zip
4. After 3 good iterations → Chrome Web Store ($5)
```

---

## 22. FULL TOOLCHAIN

| Tool | Purpose | Cost |
|---|---|---|
| GitHub | Version control | Free |
| Vercel | Backend hosting | Free |
| Turso | Database | Free |
| OpenCode | AI coding agent | Free |
| Chrome DevTools | Extension debugging | Built-in |
| Gemini Flash API | OCR for screenshots | Free tier |

**Total V1 cost: $0**

---

## 23. BEFORE FIRST OPENCODE SESSION — CHECKLIST

```
□ GitHub private repo created
□ turso auth login → turso db create tokenlite → run schema
□ Vercel account → connected to GitHub repo
□ Gemini API key → aistudio.google.com (free)
□ PostHog → skip for V1, add in V2
□ OpenCode installed and working
□ This doc + TokenLite-complete-build-doc.md open as context
```
