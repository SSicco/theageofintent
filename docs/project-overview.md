# Project Overview — The Age of Intent Website

> **This is the constitution of the project. Every other design document must be consistent with it. If a decision conflicts with this document, this document wins — flag it and resolve it here first.**

---

## What Does This Do?

A personal website that publishes a series of articles under the working title "The Age of Intent." Each article is also available as a live conversation with an AI agent that embodies the author's voice and perspective on that concept. The agent does not explain — it guides the reader to discover the concept's insight through Socratic dialogue, using the reader's own context and reasoning.

Reader conversations are stored and persisted. Every exchange is saved with a short summary, enabling the agent to maintain long-running context and enabling the author to review and improve the concepts over time.

The construction of this website is itself a live application of Concept 1 (Architecture-as-Source). At every moment, the full set of design documents should contain sufficient information for a different AI — with no prior context — to reconstruct the project and make consistent decisions. The documents are the source of truth; the code is the compiled output.

---

## Who Uses It and What Problem Does It Solve?

**Readers** encounter a series of ideas either as written articles or through live conversation with an AI that knows the concept deeply. The conversation is not a Q&A — the agent asks provocative questions that lead the reader to discover the concept through their own thinking, applied to their own situation.

**The author** uses the website to publish and iterate on the concept series over time. Accumulated reader conversations are the raw material for that iteration — a feedback loop between publication and development.

---

## The Conversational Philosophy

This is the most important and novel part of the project. The agent does **not** explain concepts to the reader. It guides the reader to discover the concept's insight through their own reasoning. This is Socratic dialogue — not instruction.

**How it works:**

The author writes a per-concept instruction document for each concept. This document contains the concept's argument skeleton — the logical structure broken into dialogue-ready nodes: premise, key tension, reframe, insight, implication. It also contains provocative entry questions designed to pull the reader in by connecting to something they already care about, as well as the conversational mood, style, and success criteria for that concept.

The agent uses this instruction document as its guide. It tracks where the reader is in the argument skeleton and steers toward the next node — always through questions, never through lecturing. The agent should build tension, create momentum toward powerful points, and make it personal to the reader's reality.

**Success** means the reader articulates the concept's insight in their own words, applied to their own context.

**What the system consumes, not creates:** The per-concept instruction documents are authored content. The author writes them outside the system, just as an author writes an article. The system's job is to consume these documents and use them to drive conversation. The format these documents must follow is defined in the content specification.

---

## What Is Explicitly Out of Scope?

- User accounts and login systems
- Real-time dashboards or admin interfaces
- Social features, public comments, or ratings
- Any backend infrastructure beyond serverless functions for API calls and exchange storage
- Analytics or tracking beyond what is needed for the author's own iteration workflow
- Writing the per-concept instruction content (the author creates this separately; the system consumes it)

---

## Non-Negotiable Principles

1. **Design documents precede code.** No component is built without a design document written first. If a design document does not exist for what is being built, stop and write it before writing any code.

2. **The documents are self-sufficient.** At every moment, the complete set of design documents must contain enough information for a different AI — with no prior conversation history — to reconstruct the project and make consistent decisions. Nothing essential lives only in conversation history or in someone's head.

3. **The reader experience is frictionless.** No system complexity is visible to the reader. Articles are clean. The conversation interface is simple. All agent orchestration operates invisibly behind a single chat interface.

4. **The site is built in phases.** Each phase is complete and functional before the next begins. Phase 1 delivered the static articles. Phase 2 adds the conversation interface and exchange storage. Phase 3 delivers the visualisation overhaul and continuous improvement pipeline.

5. **This project is the concept in practice.** The website is a live demonstration of the Age of Intent thesis — specifically Concept 1 (Architecture-as-Source) and Concept 6 (The Conversational Medium). The methodology used to build it should be consistent with the ideas it publishes.

---

## Build Phases

| Phase | What Gets Built | Status |
|-------|----------------|--------|
| 1 | Static site with articles | Complete |
| 2 | Conversation interface + exchange storage + multi-agent backend | In progress |
| 3 | Visualisation overhaul + automated continuous improvement pipeline | Not started |

### Phase 2 Scope (Current)

Phase 2 adds a conversational AI agent to each concept page. This is the core of the entire project — the living demonstration of Concept 6 (The Conversational Medium).

**What gets delivered:**
- Static site rebuilt with a conversation interface on each concept page
- Chat UI for reader-agent dialogue
- Multi-agent backend: a prompt-building agent that assembles context, and a conversation agent that talks to the reader
- Exchange storage — every exchange persisted with a summary for long-running context
- Serverless backend with API keys kept server-side

### Phase 2 Technical Decisions

**LLM Models:**
- Conversation agent: **Claude Sonnet** — talks to the reader, runs the Socratic dialogue.
- Prompt-building agent: **Claude Haiku** — assembles context, summarises prior exchanges, constructs the prompt for the conversation agent.
- Session-end agent: **Claude Haiku** — runs once at session end to produce a full session summary and extract valuable contributions.

**Sessions:**
- A session ID is generated when the reader sends their first message and stored in JavaScript memory — not in cookies, localStorage, or any persistent client-side storage. Refreshing the page starts a new session.
- Sessions expire after 1 hour of inactivity.
- Returning visitors always get a new session. Old conversations are not loaded or resumed.
- No cookies means no cookie banner, no privacy policy, and no GDPR compliance burden.

**Content Structure:**
- Each concept has two separate content files:
  - **Article** (`/content/articles/{slug}.md`) — the publishable article the reader sees. Written by the author as markdown, converted to HTML at build time by a build script.
  - **Instruction document** (`/content/instructions/{slug}.md`) — the concept instruction document the conversation agent uses. Contains the argument skeleton, conversational style, provocative entry questions, and success criteria.
- Both are authored by the author outside the development process. The system consumes them; it does not generate or modify them.
- The existing files in `/content/` (concept-1.md through concept-6.md) are research notes — raw material for writing the articles and instructions. They are not consumed by the system directly.
- A simple build script (`build.js`) converts article markdown to HTML and injects it into the static concept pages before deployment.

**Conversation Entry Point:**
- The agent opens the conversation — the reader does not need to speak first.
- The opening message is generated dynamically via the same API call as every other exchange. The frontend sends a request with an empty reader message, and the agent produces the opening based on the concept instruction document.
- This means the opening is different every time and reflects the latest version of the concept instructions — no hardcoded first message.

**Article–Conversation Navigation:**
- The concept page defaults to the conversation view.
- A button next to the reader's input bar navigates to the article view.
- The article view has a button at the bottom that returns the reader to exactly where they were in the conversation.
- The reader can switch back and forth freely without losing their place in either view.

**Exchange Limits:**
- Each session is capped at 25 exchanges.
- This limit is enforced client-side. When the cap is reached, the frontend displays a "this conversation has reached its limit" message without making an API call.
- After exchange 20, a countdown message appears: *"5 exchanges left in this session. Make sure you get to the point..."* and counts down with each subsequent exchange (4, 3, 2, 1).
- The countdown is only shown from exchange 21 onward — never before exchange 20.

**Session Timeout Countdown:**
- After 40 minutes of inactivity (no reader message), a countdown timer appears showing how many minutes remain in the session, rounded down to the nearest 5 minutes.
- The timer updates as time passes and disappears if the reader sends a message (which resets the 1-hour inactivity clock).
- The countdown is designed to inform without creating urgency — it only appears deep into inactivity, not during active conversation.

**Streaming Responses:**
- Agent responses stream token-by-token to the reader using Server-Sent Events (SSE).
- This makes the conversation feel natural — the reader sees the agent "thinking and speaking" rather than waiting for a block of text to appear.
- The Anthropic API natively supports streaming. Netlify Functions support streaming responses.

**Exchange Storage:**
- Exchanges are stored in Netlify Blobs — serverless key-value storage, no database required.
- Each session has a single blob keyed by session ID. This blob contains the full conversation history as JSON — every exchange (reader message + agent response) plus its summary.
- The blob is read and updated on every exchange: the conversation function reads the existing blob, appends the new exchange, and writes it back.
- The prompt-building agent reads this same blob to assemble context for the conversation agent.
- Each exchange is persisted with a summary generated by the prompt-building agent.

**Prompt Construction:**
- The per-concept instruction document is sent as the first block of every prompt and cached using Anthropic's prompt caching (1-hour TTL). This means the full concept content is always present but only billed once per hour.
- For the first 8 exchanges: all prior exchanges are appended directly to the prompt. No prompt-building agent is needed — the context is small enough to include raw.
- From exchange 9 onward: the prompt-building agent (Haiku) activates. It reads the conversation blob, selects and summarises relevant prior exchanges, and constructs the context block that gets appended after the cached concept document.
- The assembled prompt (cached concept doc + constructed context + current reader message) is sent to Sonnet 4.6 via the Anthropic API.

**Session-End Agent:**
- A separate agent from the prompt-building agent, also runs on Haiku.
- Triggered when a session ends (timeout or exchange limit reached).
- Produces a summary of the entire session.
- Extracts particularly valuable reader contributions and writes them to a separate JSON file.
- This data feeds the author's iteration workflow.

**Error Handling:**
- The error message is baked into the frontend HTML/JS — it does not depend on the API.
- If the backend fails or a stream breaks mid-response, the frontend displays: *"I'm sorry, but there are technical difficulties with the website and I can't continue the conversation at this time."*
- This message renders even if the API is completely unreachable, because it lives in the client, not the server.
- For partial failures mid-stream: the frontend detects the broken connection and appends the error message to whatever content was already shown.

### Phase 3 Scope (Future)

- Visualisation overhaul of the entire site
- Automated continuous improvement pipeline — reader conversations are analysed to systematically improve the concept nodes over time

---

## Repository Structure

```
theageofintent/
├── site/                    ← deployable website files (HTML, CSS, JS) — build output
├── functions/               ← serverless functions
├── content/
│   ├── articles/            ← publishable article markdown (reader-facing)
│   ├── instructions/        ← concept instruction documents (agent-facing)
│   └── contributions/       ← extracted reader contributions (auto-generated)
├── docs/                    ← current phase design documents
│   ├── components/          ← component-level design docs
│   └── archive/phase-1/    ← previous phase design documents
├── assets/                  ← images and static assets
├── build.js                 ← build script: article markdown → HTML in site/
└── netlify.toml             ← deployment configuration
```

---

*Phase: 2*
*Last updated: March 2026*
*LLM used in this session: claude-opus-4-6*
