# Project Overview — The Age of Intent Website

> **This is the constitution of the project. Every other design document must be consistent with it. If a decision conflicts with this document, this document wins — flag it and resolve it here first.**

---

## What Does This Do?

A personal website that publishes a series of articles under the working title "The Age of Intent." Each article is also available as a live conversation with an AI agent that embodies the author's voice and perspective on that concept. The agent does not explain — it guides the reader to discover the concept's insight through Socratic dialogue, using the reader's own context and reasoning.

Reader conversations are stored as JSON files. Every exchange is persisted with a short summary, enabling the agent to maintain long-running context and enabling the author to review and improve the concepts over time.

The construction of this website is itself a live application of Concept 1 (Architecture-as-Source). At every moment, the full set of design documents should contain sufficient information for a different AI — with no prior context — to reconstruct the project and make consistent decisions. The documents are the source of truth; the code is the compiled output.

---

## Who Uses It and What Problem Does It Solve?

**Readers** encounter a series of ideas either as written articles or through live conversation with an AI that knows the concept deeply. The conversation is not a Q&A — the agent asks provocative questions that lead the reader to discover the concept through their own thinking, applied to their own situation.

**The author** uses the website to publish and iterate on the concept series over time. The author writes per-concept instruction documents that define the agent's conversational approach for each concept — argument skeleton, entry questions, mood, style. Accumulated reader conversations are the raw material for iteration.

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

3. **The reader experience is frictionless.** No system complexity is visible to the reader. Articles are clean. The conversation interface is simple. The multi-agent architecture operates invisibly behind a single chat interface.

4. **The site is built in phases.** Each phase is complete and functional before the next begins. Phase 1 delivered the static articles. Phase 2 adds the conversation interface and exchange storage. Phase 3 adds the author's review workflow and visual overhaul.

5. **This project is the concept in practice.** The website is a live demonstration of the Age of Intent thesis — specifically Concept 1 (Architecture-as-Source) and Concept 6 (The Conversational Medium). The methodology used to build it should be consistent with the ideas it publishes.

---

## Build Phases

| Phase | What Gets Built | Status |
|-------|----------------|--------|
| 1 | Static site with articles | Complete |
| 2 | Conversation interface + exchange storage + multi-agent backend | In progress |
| 3 | Author review workflow + node visualisation + visual overhaul | Not started |

### Phase 2 Scope (Current)

Phase 2 adds a conversational AI agent to each concept page. This is the core of the entire project — the living demonstration of Concept 6 (The Conversational Medium).

**What gets built:**
- Static site rebuilt with conversation interface on each concept page
- Chat UI component for reader-agent dialogue
- Two-agent backend: Prompt Builder Agent + Conversation Agent
- Exchange storage — every exchange saved as JSON with summary
- Serverless backend on Netlify Functions (API key stays server-side)

**The conversational approach:**
- The agent does not lecture. It guides the reader through Socratic dialogue.
- Each concept has an author-written instruction document containing the argument skeleton, entry questions, conversational mood/style, and success criteria.
- The agent tracks the reader's position in the argument structure and steers toward insight — always through questions.
- Success = the reader articulates the concept's insight in their own words.

**The two-agent architecture:**
- **Prompt Builder Agent** — Reviews summaries of all older exchanges, selects relevant ones, assembles the full prompt for the Conversation Agent. One API call per exchange.
- **Conversation Agent** — Receives the assembled prompt (system instructions + last 8 exchanges + selected older exchanges) and responds to the reader. One API call per exchange.

### Phase 3 Scope (Future)

- Author review workflow for analysing stored conversations
- Automatic review method for improving concept nodes
- Major visualisation overhaul of the entire site

---

## Repository Structure

```
theageofintent/
├── site/                    ← deployable website files (HTML, CSS, JS)
├── functions/               ← Netlify serverless functions
├── content/                 ← concept article markdown + concept instruction documents
├── docs/                    ← current phase design documents
│   ├── components/          ← component-level design docs
│   └── archive/phase-1/    ← previous phase design documents
├── assets/                  ← images and static assets
└── netlify.toml             ← Netlify configuration
```

---

*Phase: 2*
*Last updated: March 2026*
*LLM used in this session: claude-opus-4-6*
