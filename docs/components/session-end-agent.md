# Component Design — Session-End Agent

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Related:** [Conversation Endpoint](conversation-endpoint.md) — handles the live conversation. This agent runs after it's over.

---

## What This Agent Does

Runs once when a session ends. It reads the complete session blob and produces two outputs:

1. **A session summary** — a structured overview of the entire conversation, written back to the session blob.
2. **Extracted reader contributions** — specific moments where the reader said something valuable, written to a separate contributions file.

Both outputs feed the author's iteration workflow. The reader never sees them.

---

## When It Runs

A session ends in one of two ways:

| Trigger | What happens |
|---------|-------------|
| **Exchange limit reached** (25 exchanges) | The frontend enforces the cap and stops sending requests. The conversation endpoint detects this is exchange 25 and triggers the session-end agent after persisting the final exchange. |
| **Inactivity timeout** (1 hour) | A scheduled function checks for expired sessions. When it finds one, it triggers the session-end agent for that session. |

In both cases, the session-end agent runs asynchronously — no reader is waiting for it.

---

## What It Produces

### 1. Session Summary

A structured summary of the entire conversation, written to the session blob. This gives the author a quick read of what happened without reviewing 25 exchanges.

The summary includes:

- **Concept discussed** — which concept this session was about.
- **Where the reader ended up** — did they reach the concept's insight? Did they articulate it in their own words? Did they get stuck somewhere?
- **The reader's journey** — a narrative arc of how the reader's thinking evolved. Not a list of topics, but a description of movement: where they started, what shifted, what resisted.
- **Key moments** — 2–4 specific exchanges where something significant happened (a breakthrough, a strong pushback, a personal revelation, a change of mind).
- **What the reader brought** — the reader's own context, examples, and analogies. What domain are they from? What personal experiences did they draw on?

The summary is written as prose, not bullet points. Target length: 1–2 paragraphs.

### 2. Extracted Reader Contributions

Specific moments where the reader said something the author should see. These are the raw material for improving concept instruction documents over time.

What counts as a contribution:

- **Novel framing** — the reader described the concept using an analogy or framing the author hadn't considered.
- **Strong objection** — the reader pushed back in a way that exposed a weakness in the argument skeleton.
- **Invalidating argument** — the reader made an argument that challenges the entire concept's validity, not just a single node. These are the highest-priority contributions — if a reader can dismantle the concept, the author needs to know immediately.
- **Personal application** — the reader applied the concept to their own domain in a way that reveals new implications.
- **Articulated insight** — the reader stated the concept's core insight in their own words, especially if their phrasing is better or more vivid than the author's.
- **Sticking points** — places where the reader got confused or stuck, suggesting the argument skeleton needs work at that node.

Each contribution is stored as:

```json
{
  "sessionId": "uuid",
  "conceptSlug": "architecture-as-source",
  "timestamp": "2026-03-09T15:30:00Z",
  "exchangeIndex": 14,
  "type": "novel-framing | strong-objection | invalidating-argument | personal-application | articulated-insight | sticking-point",
  "readerMessage": "The exact reader message",
  "agentMessage": "The agent message that preceded it (for context)",
  "note": "Brief explanation of why this is notable"
}
```

Contributions are appended to a per-concept contributions file: `/content/contributions/{conceptSlug}.json`. This file grows over time across all sessions for that concept.

---

## How It Detects Contributions

The session-end agent receives the **complete session blob** — every exchange (reader message + agent response + per-exchange summary). It processes the entire conversation in a single Haiku call.

It works from the full raw text of every exchange, not just the per-exchange summaries. The summaries are available but contribution extraction needs the actual reader messages — a summary would lose the exact phrasing that makes a novel framing or articulated insight worth extracting.

The single Haiku call produces both outputs — the session summary and the contributions list. Not two separate passes.

The system prompt for this call defines the six contribution types, what qualifies for each, and instructs the agent to scan every reader message for matches. For each match, it pulls the exact reader message, the preceding agent message (for context), classifies the type, and writes a brief note explaining why it's notable.

---

## Input and Output

**Input:**
- The complete session blob (all exchanges with summaries)

**Output:**
- A session summary, written to the session blob as a top-level `sessionSummary` field
- Zero or more extracted contributions, appended to the per-concept contributions file

---

## Updated Session Blob Structure

After the session-end agent runs, the blob gains a new field:

```json
{
  "conceptSlug": "architecture-as-source",
  "createdAt": "2026-03-09T14:23:00Z",
  "lastActiveAt": "2026-03-09T15:30:00Z",
  "sessionSummary": "The reader came in thinking architecture meant...",
  "exchanges": [
    {
      "index": 1,
      "readerMessage": "...",
      "agentResponse": "...",
      "summary": "...",
      "timestamp": "2026-03-09T14:23:05Z"
    }
  ]
}
```

---

## The Scheduled Function for Timeouts

The exchange-limit trigger is straightforward — the conversation endpoint knows it's exchange 25 and calls the session-end agent inline.

The timeout trigger needs a separate mechanism: a **scheduled Netlify Function** that runs periodically (e.g., every 15 minutes) and checks for sessions that have been inactive for over 1 hour.

How it works:
1. The function scans session blobs and checks `lastActiveAt`.
2. For any session where `lastActiveAt` is more than 1 hour ago and `sessionSummary` does not yet exist, it triggers the session-end agent.
3. The session-end agent writes the summary and contributions, marking the session as processed.

The `sessionSummary` field doubles as a "processed" flag — if it exists, the session-end agent has already run.

---

## What This Agent Does NOT Do

- **Does not talk to the reader.** The reader has already left or been capped. This agent has no reader-facing output.
- **Does not delete sessions.** Session blobs persist indefinitely (or until a future cleanup policy is defined). The author may want to review old sessions.
- **Does not modify exchanges.** It reads the conversation but does not change any exchange data.
- **Does not evaluate the agent's performance.** It extracts what the reader contributed, not how well the agent performed. Agent quality assessment is a Phase 3 concern.

---

## Open Questions

1. **Contributions file size** — The per-concept contributions file grows with every session. At what point does it need rotation or archiving? Probably not a Phase 2 concern, but worth noting.
2. **Contribution quality** — Can Haiku reliably distinguish a genuinely novel framing from a restatement? The `type` classification needs testing with real sessions.
3. **Scheduled function frequency** — Every 15 minutes seems reasonable. Too frequent wastes compute; too infrequent means stale sessions sit unprocessed. The exact interval can be adjusted.
4. **Short sessions** — Should the session-end agent run for sessions with only 1–2 exchanges? Probably not worth processing. A minimum threshold (e.g., 5 exchanges) may make sense.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
