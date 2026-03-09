# Working Principles — The Age of Intent Website

> **This document tells Claude Code how to behave in this project. Read it before doing anything else. These rules are non-negotiable and override default coding instincts.**

---

## The Prime Directive

Before writing any code for a component, read its design document. If no design document exists for what you are being asked to build, stop immediately and say so. Do not write any code until a design document exists. The author will write one first.

---

## The Authority Rule

The design documents are the source of truth. The code is the compiled output.

- If the code and the design document conflict, the design document wins
- Flag the conflict explicitly and ask the author how to resolve it
- Never silently \"fix\" something in code that contradicts a design document
- Never make architectural decisions that are not covered by a design document

---

## Behaviour When Uncertain

If a design document is ambiguous, incomplete, or does not cover a situation you have encountered: **stop and ask**. Do not make assumptions and proceed. Do not flag it in a comment and continue. Stop, describe exactly what is unclear, and wait for the author to resolve it in the design document before writing any code.

---

## Code Style

**Language:** Plain HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no external dependencies unless explicitly specified in the Dependencies document.

**Size:** Write the smallest amount of code that correctly implements what the design document specifies. Nothing more. Do not handle edge cases, add features, or optimise for scenarios that are not described in the design documents.

**Comments:** Do not write explanatory comments in the code. The design documents carry the explanation. Code should be clean and uncommented. If something is genuinely unclear without a comment, that is a signal the design document needs to be improved — flag it rather than papering over it with a code comment.

**Scope:** Implement exactly what the current phase's design documents describe. Do not anticipate future phases or build infrastructure for features that do not yet have design documents.

---

## File Naming and Structure

Follow the file structure specified in the System Map exactly. Do not create files or directories that are not in the System Map. If a new file is needed that is not in the System Map, stop and ask — the System Map may need to be updated first.

---

## What Claude Code Is Not Responsible For

- Deciding what to build — that comes from the design documents
- Deciding how components relate — that comes from the System Map
- Deciding what data looks like — that comes from the Data Model (when it exists)
- Making product or design decisions — those belong to the author

If you are making a decision that feels like it belongs in one of those categories, stop and ask.

---

## The Self-Sufficiency Test

At any point, the complete set of design documents should be enough for a different AI — with no prior conversation history — to pick up this project and make consistent decisions. If you notice something that would be unclear to that hypothetical AI, flag it so the relevant design document can be updated.

---

*Phase: 1*
*Last updated: March 2026*
*LLM used in this session: claude-sonnet-4-6*