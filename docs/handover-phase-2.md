# Handover Document — Phase 2 Design Session

> **Purpose:** This document captures all design decisions made during the Phase 1 → Phase 2 transition conversation. The next session should read this document, the project-overview.md, and the system-map.md before doing anything. The next version of the website will be built up from scratch according to these design principles.

---

## Current State of the Project

**Phase 1 is complete.** The static site is built and deployed with:
- Landing page (`index.html`) with author portrait background
- Six concept pages (`concept-1.html` through `concept-6.html`) with full article content
- Navigation sidebar, stylesheet, and mobile menu script
- All design documents written and consistent (see `/docs/`)
- All content source files in `/content/*.md`

**Git:** 4 commits on main. Phase 1 build is the latest commit.

---

## What Phase 2 Is

Phase 2 adds a **conversational AI agent** to each concept page. Readers can talk to "the author" about each concept. The agent guides the reader through the concept using Socratic dialogue — asking provocative questions that lead the reader to discover the concept's insight through their own reasoning, applied to their own context.

**This is the core of the entire project** — the living demonstration of Concept 6 (The Conversational Medium).

---

## Phase 2 Architecture — Agreed Design

### Per-Exchange Flow

```
Reader sends message
        │
        ▼
┌─────────────────────────┐
│   Prompt Builder Agent    │  ← Reviews summaries of all older exchanges
│                           │  ← Selects relevant older exchanges to include
│                           │  ← Assembles final prompt
└───────────┬───────────────┘
            │  (assembled prompt)
            ▼
┌─────────────────────────┐
│   Conversation Agent      │  ← System prompt: concept skeleton + Socratic guidance
│   (Claude API)            │  ← Context: last 8 exchanges + selected older ones
│                           │  ← Responds to reader
└───────────┬───────────────┘
            │
            ▼
     Save exchange as JSON
     (full content + short summary)
```

### Key Decisions Made

1. **Single knowledge node per conversation.** Phase 2 stays within one concept. No cross-concept retrieval or node switching. Each concept page has its own agent with its own knowledge.

2. **Last 8 exchanges always in context.** The most recent 8 reader-agent exchanges are included verbatim in every API call.

3. **Older exchanges saved and summarised.** Every exchange is saved as JSON with a short summary. Exchanges older than the last 8 are accessible via their summaries.

4. **Prompt Builder Agent selects relevant older exchanges.** A prompt-building step reviews the summaries of all exchanges older than 8 and determines which full exchanges should be injected alongside the last 8 for the current turn. This is re-evaluated every turn.

5. **Every exchange saved as JSON.** This was originally Phase 3 scope but has been pulled forward — you cannot have a conversation agent without persisting what it says. The project-overview.md phase table needs to be updated to reflect this.

6. **Hosting: Netlify.** Static site + serverless functions (Netlify Functions). The API key stays server-side in the serverless function.

7. **No multi-agent orchestration beyond the Prompt Builder.** The architecture is two agents: the Prompt Builder (decides what goes into the prompt) and the Conversation Agent (talks to the reader). This is deliberately simple for Phase 2.

---

## The Conversational Approach — Socratic Dialogue

This is the most important and novel part of the design. The agent does **not** explain concepts to the reader. Instead, it guides the reader to discover the concept's insight through their own reasoning.

### How It Works

- The system prompt contains the **concept's argument skeleton** — not the full article, but the logical structure: premise → key tension → reframe → insight → implication. Roughly 5-7 nodes.
- The agent has **provocative entry questions** designed to pull the reader in by connecting to something they already care about.
- The agent tracks where the reader is in the argument skeleton and steers toward the next node — **always through questions, never through lecturing**.
- Success = the reader articulates the concept's insight in their own words, applied to their own context.
- The agent should apply principles of good speech writing: build tension, create momentum toward powerful points, avoid being boring, make it personal to the reader's reality.

### What Still Needs to Be Designed

- The exact system prompt structure and instructions for the Conversation Agent
- The argument skeleton format for each concept (how to chunk a concept into dialogue-ready nodes)
- The Prompt Builder Agent's system prompt (how it decides which older exchanges are relevant)
- The JSON exchange format (what gets saved, what the summary looks like)
- The chat UI component design
- The serverless function architecture (Netlify Functions)

---

## Phase Definitions — Updated

The original phase table in `project-overview.md` needs to be updated:

| Phase | What Gets Built | Change from Original |
|-------|----------------|---------------------|
| 1 | Static site with articles | No change — **complete** |
| 2 | Conversation interface + exchange storage | Storage pulled forward from Phase 3 |
| 3 | Author review workflow + node visualisation | Storage removed (now in Phase 2), iteration workflow remains |

---

## Design Documents Needed Before Phase 2 Code Begins

Per the working principles, no code is written without a design document. The following documents need to be created:

1. **System Map v2** — updated to include all Phase 2 components
2. **Component: Chat UI** — the reader-facing conversation interface on each concept page
3. **Component: Conversation Agent** — system prompt structure, Socratic instructions, argument skeleton format
4. **Component: Prompt Builder** — how it selects relevant older exchanges, its own system prompt
5. **Component: Exchange Storage** — JSON format, file naming, where files live, summary generation
6. **Component: Serverless Backend** — Netlify Functions architecture, API call flow, security (API key handling)
7. **Dependencies v2** — updated for Phase 2 (Netlify, Claude API, any new dependencies)

---

## What the Next Session Should Do

1. Read this handover document, `project-overview.md`, `system-map.md`, and `working-principles.md`
2. Update `project-overview.md` to reflect the revised phase definitions
3. Begin writing the Phase 2 design documents listed above, starting with the System Map v2
4. **Do not write any code until all Phase 2 design documents are complete and consistent**
5. The site will be rebuilt from scratch according to the design documents — Phase 1 code is reference, not foundation

---

## Open Questions for the Author

These were discussed but not fully resolved. The next session should raise them:

- **Argument skeleton format:** How should each concept's logical structure be broken into dialogue-ready nodes? This needs to be done concept by concept with the author.
- **Prompt Builder complexity:** The agreed architecture includes a prompt-building agent that makes an extra API call per exchange. If latency or cost becomes an issue, a simpler rolling-summary approach can replace it — the architecture should be designed to allow this swap.
- **Phase 3 scope:** With storage pulled into Phase 2, Phase 3 is now primarily the author's review/iteration workflow and node visualisation. This needs further definition.

---

*Session date: March 2026*
*LLM used in this session: claude-opus-4-6*
