# Component Design — Prompt-Building Agent

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Related:** [Conversation Endpoint](conversation-endpoint.md) — the component that calls this agent.

---

## What This Agent Does

Assembles the conversation context block for the conversation agent's prompt. For the first 8 exchanges, this agent does not exist — the conversation endpoint appends raw exchanges directly. From exchange 9 onward, this agent reads the full session blob and constructs a context block that fits within a manageable prompt size while preserving conversational coherence.

It also generates a summary for each new exchange, which is stored in the session blob for future use.

---

## When It Runs

| Exchange | What happens |
|----------|-------------|
| 1–8 | Agent does not run. The conversation endpoint appends all prior exchanges verbatim. |
| 9 | Agent activates for the first time. Retroactively summarises exchanges 1–8. Constructs context block for exchange 9. |
| 10–25 | Agent runs on every exchange. Summarises the previous exchange and constructs context block for the current one. |

---

## What It Produces

Two outputs on every invocation:

### 1. Context Block

A text block inserted as Block 2 of the conversation agent's prompt (see [Conversation Endpoint — Prompt Structure](conversation-endpoint.md#prompt-structure)).

The context block is a mix of:
- **Summaries** of older exchanges — compressed representations of what was discussed.
- **Verbatim recent exchanges** — the last few exchanges included in full so the conversation agent has exact wording and tone to continue from.

The agent decides which exchanges to include verbatim and which to summarise. The goal is to give the conversation agent enough context to maintain a coherent, natural dialogue without bloating the prompt.

### 2. Exchange Summaries

After each exchange, the agent writes a summary of that exchange back into the session blob. These summaries are the raw material for future context blocks.

On first activation (exchange 9), the agent retroactively summarises exchanges 1–8 so that all exchanges have summaries available from that point forward.

---

## Input and Output

**Input:**
- The full session blob (all exchanges with any existing summaries)
- The current exchange index

**Output:**
- A context block (plain text) ready for insertion into the conversation agent's prompt
- Updated summaries for any exchanges that lacked them

---

## How It Decides What to Include

This is the core intelligence of the agent. The prompt-building agent must balance two competing needs:

1. **Continuity** — The conversation agent needs enough context to avoid repeating itself, contradicting earlier points, or losing the thread of the Socratic dialogue.
2. **Conciseness** — The prompt has a finite size. Including every exchange verbatim would eventually exceed limits and increase cost.

The general strategy:
- **Always include the last 3–4 exchanges verbatim.** The conversation agent needs exact recent context to maintain natural flow.
- **Summarise everything older.** Summaries preserve the substance (what topics were covered, what the reader revealed, where they are in the argument skeleton) without the bulk.
- **Preserve pivotal moments.** If an older exchange contains a breakthrough — the reader articulating a key insight, a strong emotional reaction, or a critical piece of personal context — the agent may include it verbatim even if it's old.

The exact strategy will be refined during implementation and testing. The agent's own prompt (its instructions for how to construct context) will be iterated on as we observe real conversations.

---

## The Agent's Own Prompt

The prompt-building agent itself needs a prompt. This prompt tells Haiku:
- What the session blob structure looks like
- What a good context block contains
- How to write useful summaries
- When to include an exchange verbatim vs. summarise it

This prompt is a static instruction document — not per-concept, since the task of context assembly is the same regardless of which concept is being discussed. It lives in the codebase (not in `/content/`), because it is a system instruction, not authored content.

---

## What This Agent Does NOT Do

- **Does not talk to the reader.** It has no reader-facing output. Its only consumer is the conversation agent's prompt.
- **Does not interpret the concept instruction document.** It works with exchange content only. The concept document is Block 1 of the prompt — this agent only constructs Block 2.
- **Does not decide what the conversation agent should say.** It provides context, not instructions. The conversation agent makes all dialogue decisions.
- **Does not run during exchanges 1–8.** Before exchange 9, context construction is mechanical — no AI judgment needed.

---

## Open Questions

1. **How many recent exchanges to include verbatim?** 3–4 is a starting estimate. Real conversations will reveal the right number — too few and the conversation agent loses flow, too many and we're not saving much.
2. **Summary quality and length** — How long should each exchange summary be? One sentence? Two? This affects both context block size and the agent's ability to reconstruct conversational continuity.
3. **Pivotal moment detection** — Can Haiku reliably identify exchanges worth preserving verbatim? Or should this be simplified to a fixed window (e.g., always include last 4, summarise everything else)?
4. **Latency budget** — This agent adds a sequential Haiku call before the Sonnet call. Target is under 1 second. Needs measurement during implementation.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
