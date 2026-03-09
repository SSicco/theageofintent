# Implementation Plan — Phase 2

> **This document tells the coding agent what to build and in what order.** Each step is a self-contained unit of work. Complete one step fully before moving to the next. Each step will be executed in a fresh context window — assume no prior conversation history.

> **Before every step:** Read `docs/working-principles.md` and the design documents listed in that step's "Read first" section. Do not read any other files. Do not look at existing code. Build from the design documents only.

---

## How to Use This Plan

1. Each step is executed in a **separate chat session** with a clean context window.
2. At the start of each step, the agent reads the design documents listed under "Read first."
3. The agent builds exactly what the step describes — nothing more, nothing less.
4. At the end of each step, the agent commits the work and confirms the "Done when" criteria are met.
5. The author reviews and approves before moving to the next step.
6. **Do not use multiple coding agents working in parallel.** One agent, one step at a time.

---

## Step 1: Project Scaffolding

**Read first:**
- `docs/working-principles.md`
- `docs/project-overview.md`
- `docs/components/content-specification.md`

**What to build:**

Set up the project structure, configuration, and dependencies so that subsequent steps have a foundation to build on.

1. Create `package.json` with the project's dependencies:
   - `@anthropic-ai/sdk`
   - `@netlify/blobs`
   - `marked` (markdown-to-HTML library for the build script)
2. Create `netlify.toml` with:
   - Build command: `node build.js`
   - Publish directory: `site/`
   - Functions directory: `functions/`
3. Create the directory structure:
   - `site/` (empty, will be populated by the build script)
   - `site/css/`
   - `site/js/`
   - `functions/`
   - `content/articles/`
   - `content/instructions/`
   - `content/contributions/`
4. Create one stub article file (`content/articles/architecture-as-source.md`) with valid frontmatter and a few paragraphs of placeholder prose, following the content specification exactly. This is for testing the build script in Step 2. Mark its status as `published`.
5. Create one stub instruction file (`content/instructions/architecture-as-source.md`) with valid frontmatter and placeholder content for each required section (Role & Voice, The Concept, Argument Skeleton, Provocative Entry Questions, Success Criteria, Boundaries). This is for testing the conversation endpoint in later steps.
6. Run `npm install`.

**Do not:**
- Write any HTML, CSS, or JavaScript yet
- Create a build script yet
- Create any serverless functions yet

**Done when:**
- `npm install` succeeds
- The directory structure matches the project overview exactly
- The stub content files pass the validation rules in the content specification (correct frontmatter, slug matches filename)
- `netlify.toml` is configured correctly

---

## Step 2: Build Script

**Read first:**
- `docs/working-principles.md`
- `docs/components/content-specification.md`
- `docs/components/frontend-site.md` (the "Article Content Pipeline" and "Build Script" sections only)

**What to build:**

The build script (`build.js`) that converts article markdown to HTML and produces the site's HTML files.

1. Write `build.js` in the project root. It must:
   - Read all markdown files from `content/articles/`
   - Parse YAML frontmatter from each file
   - Skip files where `status` is not `published`
   - Convert markdown body to HTML using `marked`
   - Generate each concept page HTML file (`site/{slug}.html`) from a template, with the article HTML injected into a hidden `<div class="article-view">`
   - Generate the landing page (`site/index.html`) with the concept list built from article frontmatter (title, description, slug), ordered by concept number
   - Validate content files on load: missing frontmatter fields, slug/filename mismatch, empty body on published articles
2. The HTML templates produced by the build script should include:
   - Links to `css/style.css` and `js/conversation.js` and `js/navigation.js` (these files don't exist yet — that's fine)
   - The structural HTML for the concept page layout (sidebar, main area, input bar) as specified in the frontend design doc
   - The structural HTML for the landing page (hero section, concept list)
   - Google Fonts link for Space Grotesk (400, 700)
3. Copy `assets/portrait.jpg` to `site/images/portrait.jpg` during the build (the landing page hero needs it).

**Do not:**
- Write CSS or JavaScript — just link to the files that will be created in Step 3
- Style anything — the HTML should be structurally correct but unstyled
- Create serverless functions

**Done when:**
- Running `node build.js` produces `site/index.html` and `site/architecture-as-source.html`
- The generated HTML has the correct structure: landing page with hero + concept list, concept page with sidebar + main area + hidden article div + input bar
- The article HTML is injected correctly into the concept page
- The build script fails with a clear error if frontmatter is invalid

---

## Step 3: CSS and Static Frontend

**Read first:**
- `docs/working-principles.md`
- `docs/components/frontend-site.md`

**What to build:**

The complete visual design and static behaviour — everything the reader sees before any conversation happens.

1. Write `site/css/style.css` — the complete stylesheet:
   - Dark palette, Space Grotesk typography, all colours as specified in the design doc
   - Landing page hero with portrait background and dark overlay gradient
   - Concept page layout: sidebar (desktop), hamburger (mobile), main content area
   - Chat message styles: agent messages (left, accent-tinted), reader messages (right, lighter)
   - Input bar: fixed bottom, textarea, send button, article toggle button
   - Article view: clean reading typography, max ~680px width
   - Responsive breakpoint at 768px
   - Exchange limit countdown styling (small, muted)
   - Session timeout countdown styling
   - Streaming cursor/animation
   - Error message styling
2. Write `site/js/navigation.js` — sidebar, hamburger menu, view switching:
   - Desktop sidebar with concept list, active concept highlighted
   - Mobile hamburger menu: slide-out overlay, concept list, backdrop
   - View switching between conversation and article (toggle visibility, preserve scroll positions independently)
   - Article toggle button behaviour (icon swap or highlight change)
   - "Return to conversation" button at bottom of article view
3. Run `node build.js` to regenerate the HTML, then verify the landing page and concept page render correctly in a browser.

**Do not:**
- Write `conversation.js` — that is Step 4
- Build any backend functionality
- Add any API integration

**Done when:**
- The landing page renders with the hero (portrait background, title, tagline, concept list)
- The concept page renders with sidebar (desktop) or hamburger (mobile)
- View switching between conversation and article works (even though conversation is empty)
- The responsive breakpoint works correctly
- The visual design matches the specification (dark palette, Space Grotesk, accent colour, generous spacing)

---

## Step 4: Conversation UI (Frontend Only)

**Read first:**
- `docs/working-principles.md`
- `docs/components/frontend-site.md`

**What to build:**

The complete conversation UI — chat display, input handling, session state, SSE stream processing, error handling. Everything the frontend needs to talk to the backend, even though the backend doesn't exist yet.

1. Write `site/js/conversation.js` — the complete chat logic:
   - Session state management (session ID, exchange count, streaming flag, etc.) — all in JavaScript memory, no persistence
   - Session ID generation on first exchange (`crypto.randomUUID()`)
   - `sendMessage()` function: sends POST to `/.netlify/functions/conversation`, processes SSE stream, appends tokens to agent message
   - Opening exchange on page load: loading indicator, then `sendMessage("")`
   - Chat message display: agent messages left-aligned, reader messages right-aligned, auto-scroll with pause-on-scroll-up
   - Streaming display: tokens appended as they arrive, blinking cursor during streaming
   - Input bar: auto-expanding textarea, Enter to send, Shift+Enter for newline
   - Input disabled during streaming and until `{"ready": true}` event arrives
   - Exchange limit enforcement: cap at 25, countdown from exchange 21 onward
   - Session timeout: 1-hour inactivity timer, countdown display after 40 minutes
   - Error handling: hardcoded error message for all failure scenarios, partial stream preservation
   - Session-ended state: input bar replaced with limit/timeout message
   - Basic markdown rendering in messages: bold, italic, paragraphs, line breaks
2. Run `node build.js` to regenerate the HTML.

**Do not:**
- Create any backend functions — the frontend should be complete but will show the error message when it can't reach the API (this is expected)
- Implement the prompt-building agents
- Implement the session-end agent

**Done when:**
- The conversation UI renders correctly on the concept page
- The input bar works (typing, auto-expand, Enter/Shift+Enter)
- The opening exchange fires on page load (and shows the error message since there's no backend — that's correct)
- View switching preserves conversation state
- The exchange countdown appears when `exchangeCount` reaches 21 (testable by manually incrementing)
- The timeout countdown logic works (testable by setting `lastMessageTime` to 40+ minutes ago)

---

## Step 5: Conversation Endpoint (Exchanges 1–8)

**Read first:**
- `docs/working-principles.md`
- `docs/components/conversation-endpoint.md`
- `docs/components/content-specification.md` (for instruction file format)

**What to build:**

The core Netlify Function that handles conversation — but only the simple path (exchanges 1–8, no prompt-building agents). This gets a working end-to-end conversation running.

1. Write `functions/conversation.js` (or `functions/conversation/index.js` if Netlify requires a directory):
   - Receive POST request with `sessionId`, `conceptSlug`, `message`
   - Read the session blob from Netlify Blobs (or create a new one if it doesn't exist)
   - Read the instruction document from `content/instructions/{conceptSlug}.md`, strip the frontmatter
   - Build the prompt: instruction document (Block 1) + all prior exchanges raw (Block 2) + current reader message (Block 3)
   - Use Anthropic prompt caching for Block 1 (the instruction document)
   - Call Claude Sonnet via the Anthropic SDK with streaming enabled
   - Relay the stream as SSE events: `{"token": "..."}` for each token, `{"done": true}` when complete
   - After streaming completes: persist the new exchange to the session blob (append to exchanges array, update `lastActiveAt`)
   - Send `{"ready": true}` after persist completes, then close the SSE connection
2. Handle the opening exchange: when `message` is empty string, this is the first exchange — the agent generates the opening dynamically from the instruction document.

**Do not:**
- Implement the summariser agent
- Implement the context assembler agent
- Implement the session-end agent
- Handle the exchange 9+ path — just include all prior exchanges raw regardless of count (this will be replaced in Step 6)

**Done when:**
- The concept page loads, the agent streams an opening message, and the reader can have a multi-exchange conversation
- Exchanges are persisted in Netlify Blobs and survive across exchanges within a session
- The SSE stream works correctly (tokens arrive, done event fires, ready event fires)
- The frontend input bar re-enables after the ready event
- Refreshing the page starts a new session (new session ID, new opening message)
- The instruction document is prompt-cached (verify via Anthropic API response headers or logs)

---

## Step 6: Prompt-Building Agents (Exchange 9+)

**Read first:**
- `docs/working-principles.md`
- `docs/components/prompt-building-agent.md`
- `docs/components/conversation-endpoint.md`

**What to build:**

The two Haiku agents that manage context for long conversations, integrated into the conversation endpoint.

1. **Summariser agent:**
   - After each exchange is persisted (from exchange 9 onward), call Haiku to generate a 2–4 sentence summary
   - On first activation (exchange 9): retroactively summarise exchanges 1–8
   - Write summaries to the `summary` field on each exchange in the session blob
   - The summariser runs after the `{"done": true}` event but before the `{"ready": true}` event — the reader sees the response but can't send the next message until summarisation is complete
   - Write the summariser's system prompt as a static string in the codebase (not in `/content/`)

2. **Context assembler agent:**
   - Before calling the conversation agent (from exchange 9 onward), call Haiku to assemble the context block
   - Assembly rules: last 4 exchanges verbatim, older exchanges as summaries, reference detection pulls older exchanges verbatim
   - The context block replaces Block 2 in the prompt (instead of raw exchanges)
   - Write the context assembler's system prompt as a static string in the codebase
   - No cap on referenced exchanges — include all detected references. If the total prompt would exceed 200k tokens, drop the oldest summaries first

3. **Update the conversation endpoint:**
   - Modify the prompt-building logic to branch: exchanges 1–8 use raw exchanges, exchange 9+ use the context assembler
   - Adjust the SSE flow: `done` → summariser runs → `ready`

**Do not:**
- Implement the session-end agent
- Modify the frontend — it already handles the `done`/`ready` flow correctly

**Done when:**
- Conversations past exchange 8 work correctly — the context assembler runs and the conversation agent still has coherent context
- Summaries are written to the session blob after each exchange (from exchange 9 onward)
- Exchanges 1–8 are retroactively summarised when exchange 9 is reached
- The `ready` event fires only after summarisation completes
- Reference detection works: when the reader refers back to an older topic, the conversation agent has the full exchange available

---

## Step 7: Session-End Agent

**Read first:**
- `docs/working-principles.md`
- `docs/components/session-end-agent.md`

**What to build:**

The agent that runs when a session ends, plus the scheduled function that detects timed-out sessions.

1. **Session-end agent function** (`functions/session-end.js` or similar):
   - Receives a session ID
   - Reads the complete session blob
   - Calls Haiku with the full session (all exchanges) in a single call
   - Produces two outputs:
     - A session summary (prose, 1–2 paragraphs) — written to the session blob as `sessionSummary`
     - Zero or more extracted contributions — appended to `content/contributions/{conceptSlug}.json`
   - The six contribution types: novel-framing, strong-objection, invalidating-argument, personal-application, articulated-insight, sticking-point
   - Each contribution includes: sessionId, conceptSlug, timestamp, exchangeIndex, type, readerMessage, agentMessage, note
   - Write the session-end agent's system prompt as a static string in the codebase

2. **Exchange-limit trigger:**
   - In the conversation endpoint, when the exchange count reaches 25, trigger the session-end agent after persisting the final exchange
   - This can be a direct function call or an internal invocation — the reader is not waiting

3. **Scheduled function for timeouts** (`functions/session-cleanup.js` or similar):
   - Runs every 15 minutes (configured in `netlify.toml`)
   - Scans session blobs, checks `lastActiveAt`
   - For sessions inactive > 1 hour where `sessionSummary` does not exist: triggers the session-end agent
   - Every session is processed regardless of length (no minimum exchange threshold)

**Do not:**
- Modify the frontend
- Modify the conversation UI
- Add any reader-facing output

**Done when:**
- After exchange 25, the session blob gains a `sessionSummary` field
- Contributions are written to the correct per-concept JSON file
- The scheduled function correctly identifies expired sessions and triggers processing
- The `sessionSummary` field prevents double-processing
- Sessions with 1–2 exchanges are processed the same as longer sessions

---

## Step 8: Stub Content for All Concepts

**Read first:**
- `docs/working-principles.md`
- `docs/components/content-specification.md`

**What to build:**

Stub content files for all six concepts so the full site is navigable and testable. The author will replace these with real content later.

1. Create article files for concepts 2–6 in `content/articles/` with valid frontmatter, placeholder prose, and `status: published`
2. Create instruction files for concepts 2–6 in `content/instructions/` with valid frontmatter and placeholder content for all required sections
3. Run `node build.js` to generate all concept pages and the landing page with all six concepts listed

**Do not:**
- Write real article or instruction content — use clear placeholder text that the author will replace
- Modify any code

**Done when:**
- All six concept pages exist and are navigable from the landing page and sidebar
- Each concept page has a working conversation (using placeholder instruction content)
- The build script successfully processes all six articles
- The landing page lists all six concepts in order

---

## After All Steps

The complete Phase 2 site is functional:
- Landing page with six concept cards
- Each concept page with conversation view (default) and article view
- Multi-exchange conversations with streaming responses
- Context management for long conversations (9+ exchanges)
- Session persistence in Netlify Blobs
- Session-end processing with summaries and contribution extraction
- Responsive design (desktop sidebar, mobile hamburger)

The author then replaces the stub content files with real articles and instruction documents. The system consumes them without any code changes.

---

*Phase: 2*
*Last updated: March 2026*
