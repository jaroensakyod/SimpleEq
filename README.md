<div align="center">

# ⚗️ Simple Eq

**Easy Copy and Paste Equation To Word**

*Power By The Coach*

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![KaTeX](https://img.shields.io/badge/KaTeX-Rendering-007BFF?style=flat-square)](https://katex.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

</div>

---

## 🎯 Overview

**Simple Eq** is a Chrome Extension Side Panel that lets teachers and content creators **copy equations from any webpage** and instantly render them as beautiful LaTeX — right alongside Google Docs, Google Slides, Canva, or any other tab.

No switching windows. No manual paste. Just **copy → auto-fill → render**.

```
Any Webpage   ──── Copy ────▶  Simple Eq (Side Panel)  ────▶  Beautiful Equation
(Google Docs,                   (KaTeX Rendered)               Ready to use
 Word Online,
 Canva, etc.)
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 📌 **Side Panel** | Opens as a half-screen panel beside any tab — no popup, no alt-tab |
| ⚡ **Auto-Capture** | Copy text on any site → instantly appears in Box 1 |
| 🔄 **Auto-Convert** | One click converts plain text patterns to LaTeX (`a/b` → `\frac{a}{b}`) |
| ✨ **KaTeX Render** | Renders `$inline$` and `$$display$$` math with high-precision KaTeX |
| 📊 **Table Support** | Preserves Word/Google Docs table structure with math in each cell |
| 🗑️ **Clean All** | One-click clear for each box |
| 📋 **Copy Result** | Copy the rendered output with one click |

---

## 🚀 Installation (Developer Mode)

> ⚠️ This extension is not yet published to the Chrome Web Store. Install manually via Developer Mode.

### Steps

1. **Download** or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the `SimpleEq` folder
6. The ⚗️ icon will appear in your Chrome toolbar

---

## 📖 How to Use

### 3-Step Flow

```
┌─────────────────────────────────────────┐
│  ① Copy text from any webpage           │
│     → Auto-appears in Box 1 ⚡          │
└──────────────────┬──────────────────────┘
                   │ [🔄 แปลง]  ← optional
                   ▼
┌─────────────────────────────────────────┐
│  ② Edit LaTeX in Box 2                  │
│     $inline$  or  $$display$$           │
└──────────────────┬──────────────────────┘
                   │ [✨ แสดงผล]
                   ▼
┌─────────────────────────────────────────┐
│  ③ Result — beautiful equation output   │
│     [📋 Copy]                           │
└─────────────────────────────────────────┘
```

### Opening the Side Panel

- Click the **⚗️ icon** in the toolbar → Side Panel opens beside your current tab
- The panel stays open as you browse — switch tabs freely

### Auto-Capture

When the Side Panel is open, simply **select and copy** (`Ctrl+C`) any text on the page:
- The text lands in **Box 1 automatically** (a ⚡ Auto badge flashes)
- Tables and lists from Google Docs are preserved

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Platform | Chrome Extension, Manifest V3 |
| UI | Vanilla HTML / CSS / JavaScript |
| Math Engine | KaTeX (bundled locally) |
| Messaging | Chrome Side Panel API + Long-lived Ports |

---

## 📁 Project Structure

```
SimpleEq/
├── manifest.json          # MV3 config — permissions, side panel
├── background.js          # Service worker — relay messages to side panel
├── content_script.js      # Injected in all pages — captures copy events
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── vendor/
│   └── katex/             # KaTeX bundled locally (CSP-safe)
│       ├── katex.min.js
│       ├── katex.min.css
│       └── fonts/
└── sidepanel/
    ├── index.html         # Side panel UI
    ├── sidepanel.css      # Dark glassmorphism theme
    └── sidepanel.js       # Full logic — render, convert, auto-paste
```

---

## 🔧 How It Works

```
content_script.js          background.js            sidepanel.js
      │                          │                        │
      │  copy event fired        │                        │
      │ ──sendMessage──────────► │                        │
      │  { type: COPY_EVENT,     │  port.postMessage ──► │
      │    html, text }          │                        │
                                                   ↓ box1.innerHTML = html
                                                   ↓ syncState()
                                                   ↓ ⚡ Auto badge flashes
```

- **Content Script** listens for `copy` events on every tab
- **Background** receives the message and relays it to the side panel via a long-lived port
- **Side Panel** populates Box 1 and updates UI state automatically

---

## 📄 License

Copyright © 2026 **The Coach inc.**
All rights reserved — reproduction or modification without permission is prohibited.
