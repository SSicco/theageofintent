# Component Design — Frontend & Site

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Related:** [Conversation Endpoint](conversation-endpoint.md) — the backend this frontend talks to.

---

## What This Component Does

The entire reader-facing website: the landing page, the concept pages (article view and conversation view), the navigation, and the chat UI. Everything the reader sees and interacts with. Built as a static site with vanilla HTML, CSS, and JavaScript — no framework, no build step, no dependencies beyond what ships in the browser.

---

## Site Structure

```
┌──────────────────────────────────────────┐
│  Landing Page (index.html)               │
│  - Hero with portrait background         │
│  - Series title + tagline                │
│  - Concept list as entry points          │
└──────────────────────────────────────────┘
         │
         ▼  (reader clicks a concept)
┌──────────────────────────────────────────┐
│  Concept Page (concept-{slug}.html)      │
│  - Sidebar with concept list (desktop)   │
│  - Hamburger menu (mobile)               │
│  - Main area: conversation OR article    │
│  - Toggle between views                  │
└──────────────────────────────────────────┘
```

Each concept gets its own HTML page. No client-side routing, no SPA — plain static pages that Netlify serves directly.

---

## Visual Design

**Aesthetic:** Modern, clean, minimal. Dark-leaning palette. The site should feel like a serious intellectual space — not a corporate landing page and not a personal blog. Think: the intersection of a design portfolio and a longform publication.

**Typography:** A single sans-serif font family (system font stack or a clean Google Font like Inter or Space Grotesk). Large, confident headings. Generous line height and letter spacing for body text. The text should breathe.

**Colour palette:**
- Background: near-black or very dark grey (`#0a0a0a` to `#141414`)
- Text: off-white (`#e8e8e8` to `#f0f0f0`)
- Accent: a single muted colour for links, active states, and the concept nav highlight. Something warm — muted gold, amber, or copper. Not neon, not primary.
- Chat bubbles: reader messages slightly lighter than background; agent messages with a subtle accent-tinted background.
- Borders and dividers: very subtle, low-contrast lines (`rgba(255,255,255,0.08)`)

**Landing page hero:**
- Full-viewport background using the author's portrait (`/assets/portrait.jpg`) — the android image.
- Image treated with a dark overlay gradient so text remains legible.
- Series title "The Age of Intent" and a one-line tagline centered over the image.
- Below the hero fold: concept list as clickable cards or links leading to each concept page.

**Overall feel:** Intentional whitespace, restrained colour, sharp typography. Every element earns its place.

---

## Page Layouts

### Landing Page

```
┌─────────────────────────────────────────────┐
│                                             │
│        [portrait.jpg as background]         │
│                                             │
│          THE AGE OF INTENT                  │
│          tagline goes here                  │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│   Concept 1: Architecture-as-Source    →    │
│   Concept 2: ...                       →    │
│   Concept 3: ...                       →    │
│   ...                                       │
│                                             │
└─────────────────────────────────────────────┘
```

- The hero section is full viewport height.
- Concept list below the fold, clean cards with concept title and a one-line description.
- Clicking a concept navigates to its concept page.

### Concept Page — Desktop

```
┌────────┬────────────────────────────────────┐
│        │                                    │
│ Nav    │   Main Content Area                │
│ Bar    │                                    │
│        │   Either:                          │
│ C1 ●   │   - Conversation view (default)   │
│ C2     │   - Article view                  │
│ C3     │                                    │
│ C4     │                                    │
│ C5     │                                    │
│ C6     │                                    │
│        │                                    │
│        ├────────────────────────────────────┤
│        │  [input bar]  [article toggle]     │
└────────┴────────────────────────────────────┘
```

- **Left sidebar** (~200px): lists all concepts. The active concept is highlighted. Clicking another concept navigates to that page.
- **Main area**: fills remaining width. Shows either conversation or article.
- **Input bar**: fixed at the bottom of the main area.

### Concept Page — Mobile

```
┌─────────────────────────┐
│ ☰  The Age of Intent    │
├─────────────────────────┤
│                         │
│   Main Content Area     │
│                         │
│   Conversation or       │
│   Article view          │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ [input bar] [toggle]    │
└─────────────────────────┘
```

- **Hamburger icon** (top-left): opens a slide-out or overlay menu listing all concepts.
- No persistent sidebar — screen space goes entirely to the conversation or article.
- Input bar fixed at the bottom, same as desktop.
- Breakpoint: sidebar collapses to hamburger at `768px` or below.

---

## Conversation View

This is the default view when a reader opens a concept page. The agent opens the conversation — the reader does not need to speak first.

### Chat Message Display

Messages appear in a vertical scrolling area:

- **Agent messages**: left-aligned. Subtle accent-tinted background. The agent's name or a small icon at the top.
- **Reader messages**: right-aligned. Slightly lighter background than the page. No avatar needed.
- Messages support basic markdown rendering: bold, italic, line breaks, paragraphs. No code blocks, no images, no complex formatting.
- New messages animate in with a subtle fade or slide — nothing flashy.
- The chat area auto-scrolls to the latest message. If the reader has scrolled up to review older messages, auto-scroll pauses until they scroll back to the bottom.

### Streaming

Agent responses stream token-by-token:

- When a response is streaming, a blinking cursor or subtle animation appears at the end of the current text.
- Tokens are appended as they arrive via SSE.
- The reader can scroll up during streaming without disrupting it.
- If the stream breaks mid-response, whatever content was already shown remains visible, and the baked-in error message is appended.

### Input Bar

Fixed at the bottom of the main content area:

```
┌───────────────────────────────────┬──────┬──────┐
│  Type your message...             │  📄  │  ➤   │
└───────────────────────────────────┴──────┴──────┘
                                      │       │
                                      │       └─ Send button
                                      └─ Article toggle button
```

- **Text input**: auto-expanding textarea (grows with content, up to ~4 lines, then scrolls internally). Placeholder text: "Type your message..."
- **Send button**: sends the message. Also triggered by Enter key. Shift+Enter for newline.
- **Article toggle button**: a document/page icon. Navigates to the article view. Tooltip: "Read the article."
- The input bar is **disabled** while the agent is streaming a response. Visual indicator: greyed out, send button inactive.
- When the session has ended (exchange limit or timeout), the input bar is replaced with a message: "This conversation has reached its limit. Refresh the page to start a new one."

### Exchange Limit Countdown

From exchange 21 onward, a small notice appears above the input bar:

- Exchange 21: "5 exchanges remaining"
- Exchange 22: "4 exchanges remaining"
- ...
- Exchange 25: input bar replaced with the session-ended message.

The countdown is subtle — small text, muted colour. Informative, not alarming.

### Session Timeout Countdown

After 40 minutes of inactivity:

- A small timer appears above the input bar showing minutes remaining, rounded down to the nearest 5 minutes.
- Updates as time passes. Example: "Session expires in ~15 minutes."
- Disappears immediately when the reader sends a message (which resets the 1-hour clock).
- If the session expires while the reader is on the page, the input bar is replaced with: "This session has expired. Refresh the page to start a new one."

---

## Article View

Toggled via the article toggle button in the input bar.

- Renders the concept's article content as clean, readable prose.
- The article is the published version of the concept markdown from `/content/`.
- Styled consistently with the site's typography: generous margins, comfortable reading width (max ~680px), large body text.
- At the bottom of the article, a button: "Return to conversation." Clicking it switches back to the conversation view, preserving the reader's exact scroll position and conversation state.
- The article toggle button in the input bar changes to indicate the reader is in article view (icon swap or highlight change). Clicking it again also returns to conversation.

### View Switching

- Switching between article and conversation is instant — no page reload, no API call.
- Both views exist in the DOM simultaneously. Switching toggles visibility.
- The conversation continues to exist in memory while the article is shown. If a stream is somehow in progress, it continues silently.
- Scroll position is preserved independently for each view. Returning to the conversation puts the reader exactly where they were.

---

## Session Management (Client-Side)

### Session ID

- Generated when the reader's first message is sent (the opening exchange — an empty reader message).
- Stored in a JavaScript variable in memory. Not in localStorage, sessionStorage, cookies, or any persistent storage.
- Refreshing the page loses the session and starts a new one.

### Session State

The frontend tracks:

```javascript
{
  sessionId: "uuid",          // generated on first exchange
  conceptSlug: "concept-slug", // from the page
  exchanges: [],               // local copy of all exchanges
  exchangeCount: 0,            // for enforcing the 25-exchange cap
  lastMessageTime: null,       // for timeout countdown
  isStreaming: false,           // true while agent is responding
  sessionEnded: false          // true when limit reached or timeout
}
```

This state lives entirely in JavaScript memory. No persistence whatsoever.

---

## API Integration

### Sending a Message

```javascript
// Pseudocode
async function sendMessage(message) {
  if (sessionEnded || isStreaming) return;
  if (exchangeCount >= 25) {
    endSession("limit");
    return;
  }

  isStreaming = true;
  disableInput();
  appendReaderMessage(message);

  // Generate session ID on first exchange
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  try {
    const response = await fetch("/.netlify/functions/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        conceptSlug,
        message
      })
    });

    if (!response.ok) throw new Error("API error");

    // Process SSE stream
    const reader = response.body.getReader();
    appendAgentMessage(""); // create empty agent message element
    // ... read stream, append tokens to agent message ...

  } catch (error) {
    appendErrorMessage();
  } finally {
    isStreaming = false;
    enableInput();
    exchangeCount++;
    lastMessageTime = Date.now();
  }
}
```

### Opening Exchange

When the concept page loads:

1. The chat area shows a brief loading indicator (e.g., three animated dots).
2. The frontend calls `sendMessage("")` — empty string for the reader message.
3. The agent's opening message streams in.
4. The input bar becomes active.

This means the page loads, immediately fires the opening request, and the reader sees the agent start talking within a second or two.

### SSE Stream Processing

The frontend reads the SSE stream from the conversation endpoint:

- Each `data:` event contains a JSON object with either `{"token": "..."}` or `{"done": true}`.
- Tokens are appended to the current agent message element as they arrive.
- On `{"done": true}`, streaming ends and the input bar is re-enabled.
- On connection close without `{"done": true}`, the stream is treated as broken — the error message is appended.

---

## Error Handling

The error message is hardcoded in the frontend — it does not come from the API:

> "I'm sorry, but there are technical difficulties with the website and I can't continue the conversation at this time."

This message renders in all failure scenarios:

- API unreachable (network error, function cold start timeout)
- Non-200 response from the endpoint
- Stream breaks mid-response (connection drops)
- Any unexpected JavaScript error during stream processing

For mid-stream failures: the partial content already displayed stays visible. The error message is appended as a new agent message below whatever was already shown.

The input bar remains enabled after an error — the reader can try sending another message. If the backend has recovered, the conversation continues.

---

## File Structure

```
site/
├── index.html                  ← landing page
├── concept-1.html              ← one page per concept
├── concept-2.html
├── concept-3.html
├── concept-4.html
├── concept-5.html
├── concept-6.html
├── css/
│   └── style.css               ← single stylesheet
├── js/
│   ├── conversation.js         ← chat logic, SSE handling, session state
│   └── navigation.js           ← sidebar, hamburger menu, view switching
└── images/                     ← any processed/optimised images
```

All files are static. No build step, no bundler, no transpiler. The CSS and JS are written directly — what's in the repo is what gets deployed.

---

## Responsive Behaviour

| Viewport | Sidebar | Menu | Input bar | Chat area |
|----------|---------|------|-----------|-----------|
| > 768px | Visible, fixed left | — | Full width minus sidebar | Full width minus sidebar |
| ≤ 768px | Hidden | Hamburger top-left, opens overlay | Full width | Full width |

The hamburger menu overlay:
- Slides in from the left or fades in as an overlay.
- Lists all concepts with the active one highlighted.
- Tapping a concept navigates to that page.
- Tapping outside the menu or a close button dismisses it.
- The overlay has a semi-transparent dark backdrop.

---

## What This Component Does NOT Do

- **Does not persist anything client-side.** No localStorage, no cookies, no IndexedDB. Everything lives in JavaScript memory and is lost on refresh.
- **Does not handle authentication.** No login, no user accounts, no identity.
- **Does not render complex markdown.** The chat supports bold, italic, paragraphs, and line breaks. No tables, code blocks, images, or embedded media.
- **Does not pre-render articles.** Articles are rendered from markdown at build time into the static HTML pages. They are not fetched dynamically.
- **Does not communicate with any service other than the conversation endpoint.** One API, one endpoint, one integration point.

---

## Open Questions

1. **Font choice** — Inter, Space Grotesk, or system font stack? System fonts avoid the network request but are less distinctive. Needs a visual decision once the first page is built.
2. **Portrait image treatment** — How much overlay/gradient on the landing page hero? Too much darkening loses the image; too little makes text unreadable. Needs iteration with the actual image.
3. **Article content pipeline** — The concept markdown files currently contain research notes, not publishable articles. How are the final articles produced and converted to HTML for the static pages? This is an authoring workflow question, not a frontend question, but the frontend needs the final HTML.
4. **Concept page URLs** — Should URLs be `/concept-1.html` (by number) or `/architecture-as-source.html` (by slug)? Slugs are more meaningful but require a mapping. The project overview uses slugs in the API contract.
5. **Agent name/icon** — Does the agent have a visible name or avatar in the chat? Or is it anonymous? The design currently assumes a minimal indicator (small icon or label) but this is a brand decision.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
