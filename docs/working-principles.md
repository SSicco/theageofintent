# Working Principles — The Age of Intent Website

> **This document tells the coding agent how to behave in this project. Read it before doing anything else. These rules are non-negotiable and override default coding instincts.**

> **Parent document:** [Project Overview](project-overview.md). All decisions here must be consistent with it.

---

## The Prime Directive

Before writing any code for a component, read its design document in `docs/components/`. If no design document exists for what you are being asked to build, **stop immediately and say so. Do not write any code** until a design document exists. The author will write one first.

If the design document exists but has unresolved open questions that affect the code you are about to write, **stop and say so.** Do not guess the answer. Do not pick the most likely option. Wait for the author to resolve the open question in the document first.

---

## The Authority Rule

The design documents are the source of truth. The code is the compiled output.

- If the code and the design document conflict, the design document wins
- Flag the conflict explicitly and ask the author how to resolve it
- Never silently "fix" something in code that contradicts a design document
- Never make architectural decisions that are not covered by a design document

The document hierarchy is:

1. **`project-overview.md`** — the constitution. Overrides everything else.
2. **`working-principles.md`** (this document) — operational rules for the coding agent.
3. **Component design documents** (`docs/components/*.md`) — detailed specifications for each component.

If two component documents conflict, flag it and stop. The author resolves it by updating the documents, not by you choosing which one to follow.

---

## Behaviour When Uncertain

If a design document is ambiguous, incomplete, or does not cover a situation you have encountered: **stop and ask**. Do not make assumptions and proceed. Do not flag it in a comment and continue. Stop, describe exactly what is unclear, and wait for the author to resolve it in the design document before writing any code.

This includes:

- A parameter, format, or behaviour that is not specified
- A flow where two documents give different answers
- An edge case that the design document does not address
- A dependency or library that seems needed but is not mentioned

In all of these cases: **stop. Do not guess.**

---

## Code Style

**Language:** Plain HTML, CSS, and vanilla JavaScript for the frontend. Node.js for serverless functions. No frameworks, no build tools beyond `build.js`, no external dependencies unless explicitly specified in a design document.

**Size:** Write the smallest amount of code that correctly implements what the design document specifies. Nothing more. Do not handle edge cases, add features, or optimise for scenarios that are not described in the design documents.

**Comments:** Do not write explanatory comments in the code. The design documents carry the explanation. Code should be clean and uncommented. If something is genuinely unclear without a comment, that is a signal the design document needs to be improved — flag it rather than papering over it with a code comment.

**Scope:** Implement exactly what the current phase's design documents describe. Do not anticipate future phases or build infrastructure for features that do not yet have design documents.

---

## Dependencies

The following are the only external dependencies for this project:

- **Anthropic SDK** (`@anthropic-ai/sdk`) — for API calls to Claude (conversation agent, prompt-building agent, session-end agent)
- **Netlify Functions** runtime — the serverless execution environment
- **Netlify Blobs** (`@netlify/blobs`) — for exchange and session storage
- **A markdown-to-HTML library** — for the build script (specific library to be determined in the build script design document)

Never add an external dependency without a design document specifying it. If you are considering adding a dependency, **stop and ask the author** — there may be a simpler alternative.

---

## File Naming and Structure

Follow the repository structure specified in the [Project Overview](project-overview.md) exactly:

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

Do not create files or directories that are not in this structure. If a new file is needed that is not listed here, **stop and ask** — the repository structure may need to be updated in the Project Overview first.

---

## What the Coding Agent Is Not Responsible For

- Deciding what to build — that comes from the design documents
- Deciding how components relate — that comes from the Project Overview
- Deciding what data looks like — that comes from the component design documents
- Making product, design, or UX decisions — those belong to the author
- Writing article content or concept instruction documents — the author creates those

If you are making a decision that feels like it belongs in one of those categories, **stop and ask.**

---

## The Self-Sufficiency Test

At any point, the complete set of design documents should be enough for a different AI — with no prior conversation history — to pick up this project and make consistent decisions. If you notice something that would be unclear to that hypothetical AI, flag it so the relevant design document can be updated.

This is not a nice-to-have. This is the operating principle of the project. The documents are the source; everything else is compiled output.

---

## Open Questions in Design Documents

Some component design documents have an "Open Questions" section. These are questions the author has identified but not yet resolved.

**Rules for open questions:**

- If an open question does not affect the code you are writing, you may proceed. Note in your response that you are aware of the open question and explain why it does not block you.
- If an open question **does** affect the code you are writing, **stop and ask.** Do not pick an answer. Do not implement "the most reasonable option." The author resolves open questions by updating the design document.
- When an open question is resolved, the author updates the design document and removes it from the open questions section. The section should eventually read: "No open questions remain for this component."

---

*Phase: 2*
*Last updated: March 2026*
