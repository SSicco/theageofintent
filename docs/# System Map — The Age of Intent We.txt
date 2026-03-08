# System Map — The Age of Intent Website

> **Phase 1 only.** This document describes the complete system as it exists in Phase 1. It will be extended — and where necessary rewritten — when Phase 2 begins. Any AI picking up this project should treat this as the complete and current picture.

---

## What Phase 1 Is

A static website. Seven HTML pages served directly to the browser. No server, no database, no API calls. The browser receives files and renders them. That is the entire system.

---

## Components

### 1. Landing Page (`index.html`)
The entry point to the website. Displays a full-screen AI-altered portrait of the author as background, a brief introduction to the Age of Intent series, and the left navigation sidebar. Its only job is to orient the reader and invite them into the series.

**Relates to:** Navigation Component (included on this page), all six Concept Pages (reachable via navigation)

---

### 2. Concept Pages (`concept-1.html` through `concept-6.html`)
One page per concept. Each page renders the full written article for that concept in a readable format. The layout is side-by-side: navigation sidebar fixed on the left, article content filling the remaining space to the right. These pages have no interactive elements in Phase 1.

**Relates to:** Navigation Component (included on every page), Stylesheet (controls reading layout and typography)

The six concepts are:
| File | Concept |
|------|---------|
| `concept-1.html` | Architecture-as-Source |
| `concept-2.html` | The Strategic Probability Engine |
| `concept-3.html` | The Traceable Knowledge Layer |
| `concept-4.html` | The Divergent Success Model |
| `concept-5.html` | The Primacy of Intent |
| `concept-6.html` | The Conversational Medium |

---

### 3. Navigation Component (shared HTML block)
A fixed left sidebar listing all seven pages: the landing page and the six concept pages. Included identically on every page. On desktop it is always visible. On mobile it is hidden by default and revealed when the reader taps the hamburger icon (☰) in the top left corner.

**Relates to:** All seven pages (included on each), Stylesheet (controls sidebar layout and mobile behaviour), Navigation Script (controls open/close interaction on mobile)

---

### 4. Stylesheet (`styles.css`)
A single CSS file shared across all seven pages. Responsible for all visual styling: typography, layout, colours, sidebar behaviour, and responsive breakpoints. The mobile/desktop layout switch is handled here via a media query set at 768px — below this width the sidebar hides and the hamburger icon appears.

**Relates to:** All seven pages (linked on each), Navigation Script (the script toggles a CSS class; the stylesheet defines what that class does)

---

### 5. Navigation Script (`nav.js`)
A small JavaScript file (~10 lines) with a single responsibility: listen for a tap on the hamburger icon and toggle the sidebar open or closed. No other logic lives here.

**Relates to:** Navigation Component (the element it listens to), Stylesheet (adds/removes a CSS class that the stylesheet uses to show or hide the sidebar)

---

## File Structure

```
/
├── index.html
├── concept-1.html
├── concept-2.html
├── concept-3.html
├── concept-4.html
├── concept-5.html
├── concept-6.html
├── styles.css
├── nav.js
└── /assets
    └── portrait.jpg        ← AI-altered author portrait for landing page background
```

---

## What Is Not In Phase 1

The following components are explicitly deferred to later phases. They do not exist yet and should not be built until their design documents are written:

- AI conversation interface (Phase 2)
- Concept agent and system prompts (Phase 2)
- Conversation storage (Phase 3)
- Node visualisation (Phase 3)
- Any backend or serverless functions (Phase 2+)

---

## Layout Reference

**Desktop (screen width > 768px)**
```
┌─────────────┬──────────────────────────────────┐
│             │                                  │
│  Navigation │         Article Content          │
│   Sidebar   │                                  │
│             │                                  │
│  - Home     │                                  │
│  - C1       │                                  │
│  - C2       │                                  │
│  - C3       │                                  │
│  - C4       │                                  │
│  - C5       │                                  │
│  - C6       │                                  │
│             │                                  │
└─────────────┴──────────────────────────────────┘
```

**Mobile (screen width ≤ 768px)**
```
┌──────────────────────────────────────┐
│ ☰  The Age of Intent                 │
├──────────────────────────────────────┤
│                                      │
│           Article Content            │
│                                      │
└──────────────────────────────────────┘

When ☰ is tapped:
┌──────────────────────────────────────┐
│ ✕  The Age of Intent                 │
├─────────────┬────────────────────────┤
│             │                        │
│  Navigation │    Article Content     │
│   Sidebar   │    (behind overlay)    │
│  (overlay)  │                        │
└─────────────┴────────────────────────┘
```

---

*Phase: 1*
*Last updated: March 2026*
*LLM used in this session: claude-sonnet-4-6*