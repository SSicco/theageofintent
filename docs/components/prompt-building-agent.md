# Component Design — Prompt-Building Agents

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Related:** [Conversation Endpoint](conversation-endpoint.md) — the component that calls these agents.

---

## Overview

Two separate Haiku agents handle context management. They run at different moments in the exchange lifecycle and have different jobs:

1. **Summariser agent** — runs *after* an exchange completes. Writes a summary of that exchange to the session blob.
2. **Context assembler agent** — runs *before* the conversation agent responds. Reads the user's new message, checks for references to older exchanges, and assembles the context block.

They are split because the context assembler needs summaries to already exist before it can do its job. If the same agent did both, it would be trying to compare the user's message against summaries it hadn't written yet.

---

## Agent 1: The Summariser

### When it runs

At the end of every exchange, after the conversation agent's response has been streamed and persisted. This happens as part of the post-response flow — the reader does not wait for it.

| Exchange | What happens |
|----------|-------------|
| 1–8 | Summariser does not run. No summaries exist yet. |
| 9 (first activation) | Summariser retroactively summarises exchanges 1–8, then summarises exchange 9. |
| 10–25 | Summariser runs after each exchange and writes a summary of that exchange. |

### What it receives

- The completed exchange (reader message + agent response)
- For first activation only: all 8 prior exchanges

### What it produces

A summary of the exchange, written to the `summary` field on the exchange object in the session blob. One exchange = one summary.

### What a good summary contains

The summary must capture everything the context assembler might need later:

- **What was discussed** — the topic or sub-question explored in this exchange
- **What the reader revealed** — their position, reasoning, intuitions, personal experiences, emotional reactions
- **Where in the argument the exchange sits** — which part of the concept's Socratic progression this exchange belongs to
- **Key phrases** — distinctive words or phrases the reader used, so the context assembler can detect when the reader references them later

A summary is 2–4 sentences. Long enough to be useful for reference detection, short enough to keep the context block compact when many summaries are included.

### Example summary

> Exchange 5: Discussed whether justice requires equal outcomes or equal opportunity. The reader argued strongly for equal opportunity, citing their experience as a small business owner — "I hired the best person regardless of background, that's fair." Pushed back when asked whether equal opportunity is meaningful if starting conditions are unequal. Part of the fairness-vs-equality thread in the argument skeleton.

### Latency

The summariser runs after the response has been streamed. The reader is reading the response, not waiting for a next action. This means the summariser has a generous latency budget — it can take 1–2 seconds without any perceptible delay. If the reader sends their next message before the summariser finishes, the endpoint must wait for it to complete before proceeding (the context assembler needs the summary to exist).

---

## Agent 2: The Context Assembler

### When it runs

At the start of every exchange from exchange 9 onward, after the reader sends a message but before the conversation agent is called. Its output becomes Block 2 of the conversation agent's prompt.

### What it receives

- The reader's new message (the message just sent)
- All exchange summaries from the session blob
- All full exchanges from the session blob (needed for pulling older exchanges verbatim when references are detected)

### What it produces

A context block — the assembled text that goes into the conversation agent's prompt as Block 2.

### Assembly rules

The context block is assembled according to these fixed rules plus one AI judgment:

**Fixed rules:**
1. The **last 4 exchanges** are always included **verbatim** (full reader message + full agent response).
2. All **older exchanges** (before the last 4) are included as **summaries**.

**AI judgment — reference detection:**
3. The context assembler reads the reader's new message and compares it against the summaries of older exchanges (those beyond the last 4). If the reader's message **references, asks about, or revisits** something from an older exchange, that exchange is pulled in **verbatim** alongside the summaries.

This is the only intelligence the context assembler needs. Everything else is mechanical.

### What counts as a reference

The context assembler looks for:
- **Direct references** — "Earlier you said..." / "Going back to what we discussed about..." / "Remember when I mentioned..."
- **Topic revisits** — The reader brings up a topic or question that was discussed in an older exchange, even without explicitly saying "earlier." The summary's key phrases help detect this.
- **Contradictions or changes of mind** — The reader says something that contradicts a position they took in an older exchange. Including the original exchange lets the conversation agent address the shift.

When in doubt, the context assembler should **include** the exchange. A slightly larger context block is better than a conversation agent that has lost track of something the reader is clearly thinking about.

### Example context block

Exchange 14 of a conversation about justice. The reader's new message is: "Actually, I think I was wrong earlier about the business hiring thing. Maybe equal opportunity isn't enough."

The context assembler detects a reference to exchange 5 (where the reader discussed hiring). The context block:

```
CONVERSATION CONTEXT:

[Exchange 1 summary]
Opened with reader's initial definition of justice as "getting what you deserve."
Began exploring the circularity of desert-based definitions.

[Exchange 2 summary]
...

[Exchange 5 — included verbatim, reader references this exchange]
Reader: "I think justice is about equal opportunity. I hired the best person
regardless of background, that's fair. Everyone had the same shot."
Agent: "That's a strong intuition. But what if the candidates didn't have
the same shot before they walked in your door? What if one went to..."
Reader: "That's different. I can't fix the whole system."
Agent: "You're drawing a line between what justice demands of you personally
and what it demands of the system. Is that a distinction that holds up?"

[Exchange 6 summary]
...

[Exchange 7 summary]
...

[Exchange 8 summary]
...

[Exchange 9 summary]
...

[Exchange 10 summary]
...

[Exchange 11 — verbatim, within last 4]
Reader: "..."
Agent: "..."

[Exchange 12 — verbatim, within last 4]
Reader: "..."
Agent: "..."

[Exchange 13 — verbatim, within last 4]
Reader: "..."
Agent: "..."

[Exchange 14 — verbatim, within last 4]
Reader: "Actually, I think I was wrong earlier about the business hiring
thing. Maybe equal opportunity isn't enough."
Agent: [this is what the conversation agent will generate]
```

The conversation agent now has the exact exchange the reader is referring back to, plus full recent context, plus summaries of everything else.

---

## The Agents' Prompts

Both agents need their own system prompts. These are static instruction documents that live in the codebase (not in `/content/`).

### Summariser prompt

Tells Haiku:
- The structure of an exchange (reader message + agent response)
- What a useful summary contains (topic, reader's position, key phrases, argument location)
- Target length (2–4 sentences)
- That key phrases must be preserved for reference detection downstream

### Context assembler prompt

Tells Haiku:
- The structure of the session blob and summaries
- The fixed rules (last 4 verbatim, rest as summaries)
- How to detect references in the reader's message
- When in doubt, include the exchange
- The output format (the context block layout)

---

## How This Updates the Conversation Endpoint Flow

The conversation endpoint flow from exchange 9 onward becomes:

```
Reader sends message
        │
        ▼
  Wait for summariser to finish
  (if it's still processing the previous exchange)
        │
        ▼
  Context assembler (Haiku)
  reads new message + summaries + full exchanges
  outputs context block
        │
        ▼
  Conversation agent (Sonnet 4.6)
  receives: concept doc + context block + reader message
  streams response
        │
        ▼
  Persist exchange to blob
        │
        ▼
  Summariser (Haiku)
  writes summary of this exchange to blob
  (reader is already reading the response)
```

Two Haiku calls per exchange (from exchange 9 onward), but only one is on the critical path — the context assembler. The summariser runs after the response is delivered.

---

## What These Agents Do NOT Do

- **Do not talk to the reader.** No reader-facing output. Their only consumer is the conversation agent's prompt.
- **Do not interpret the concept instruction document.** They work with exchange content only. The concept doc is Block 1 — these agents only construct Block 2.
- **Do not decide what the conversation agent should say.** They provide context, not instructions.
- **Do not run during exchanges 1–8.** Before exchange 9, context construction is mechanical.

---

## Open Questions

1. **Summary quality** — Can Haiku write summaries that are good enough for reliable reference detection? If summaries are too generic, the context assembler won't catch subtle references. Needs testing with real conversations.
2. **Latency of context assembler** — This is on the critical path. Target is under 1 second. Needs measurement.
3. **Race condition** — If the reader sends a message before the summariser finishes processing the previous exchange, the endpoint must wait. How often does this happen in practice, and is the wait noticeable?
4. **Multiple references** — The reader might reference 2–3 older exchanges at once. Including all of them verbatim could make the context block large. Is there a cap, or do we always include all referenced exchanges?

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
