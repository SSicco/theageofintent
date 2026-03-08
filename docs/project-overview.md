# Project Overview — The Age of Intent Website

> **This is the constitution of the project. Every other design document must be consistent with it. If a decision conflicts with this document, this document wins — flag it and resolve it here first.**

---

## What Does This Do?

A personal website that publishes a series of articles under the working title "The Age of Intent." Each article is also available as a live conversation with an AI agent that embodies the author's voice and perspective on that concept. Reader conversations are stored as JSON files for the author to periodically analyse and use to improve the articles.

The construction of this website is itself a live application of Concept 1 (Architecture-as-Source). At every moment, the full set of design documents should contain sufficient information for a different AI — with no prior context — to reconstruct the project and make consistent decisions. The documents are the source of truth; the code is the compiled output.

---

## Who Uses It and What Problem Does It Solve?

**Readers** encounter a series of ideas either as written articles or through live conversation with an AI that knows the concept deeply. They do not need to read passively — they can explore at their own pace, in their own direction.

**The author** uses the website to publish and iterate on the concept series over time. Accumulated reader conversations are the raw material for that iteration — a feedback loop between publication and development.

---

## What Is Explicitly Out of Scope?

- User accounts and login systems
- Real-time dashboards or admin interfaces
- Social features, public comments, or ratings
- Any backend infrastructure beyond serverless functions for API calls and JSON conversation storage
- Analytics or tracking beyond what is needed for the author's own iteration workflow

---

## Non-Negotiable Principles

1. **Design documents precede code.** No component is built without a design document written first. If a design document does not exist for what is being built, stop and write it before writing any code.

2. **The documents are self-sufficient.** At every moment, the complete set of design documents must contain enough information for a different AI — with no prior conversation history — to reconstruct the project and make consistent decisions. Nothing essential lives only in conversation history or in someone's head.

3. **The reader experience is frictionless.** No system complexity is visible to the reader. Articles are clean. The conversation interface is simple. The agent's work happens invisibly.

4. **The site is built in phases.** Each phase is complete and functional before the next begins. Phase 1 is articles only. Phase 2 adds the conversation interface. Phase 3 adds conversation storage and the author's iteration workflow.

5. **This project is the concept in practice.** The website is a live demonstration of the Age of Intent thesis — specifically Concept 1 (Architecture-as-Source) and Concept 6 (The Conversational Medium). The methodology used to build it should be consistent with the ideas it publishes.

---

## Build Phases (High Level)

| Phase | What Gets Built | Status |
|-------|----------------|--------|
| 1 | Static site with articles | Not started |
| 2 | Conversation interface (chat with the author) | Not started |
| 3 | JSON conversation storage + author review workflow | Not started |

*Each phase has its own component design documents written before any code for that phase begins.*

---

*Last updated: March 2026*
*LLM used in this session: claude-sonnet-4-6*