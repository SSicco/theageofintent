# Component Design — Conversation Endpoint

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.

---

## What This Component Does

A single Netlify Function that handles every reader message. It receives the reader's message, builds the prompt, calls the conversation agent, streams the response back, and persists the exchange. This is the central nervous system of the conversation feature — everything flows through it.

---

## Request–Response Flow

```
Reader sends message
        │
        ▼
┌─────────────────────┐
│  Conversation        │
│  Endpoint            │
│  (Netlify Function)  │
│                      │
│  1. Read session blob│
│  2. Build prompt     │
│  3. Call Sonnet 4.6  │
│  4. Stream response  │
│  5. Persist exchange │
└─────────────────────┘
        │
        ▼
SSE stream → Reader
```

### Step-by-step

1. **Receive request** — The frontend sends the reader's message, the session ID, and the concept slug.
2. **Read the session blob** — Fetch the conversation history from Netlify Blobs using the session ID as the key. If no blob exists, this is the first exchange.
3. **Build the prompt** — Two paths:
   - **Exchanges 1–8:** The per-concept instruction document (prompt-cached) + all prior exchanges raw + the current reader message. No AI involvement.
   - **Exchange 9+:** The per-concept instruction document (prompt-cached) + context block assembled by the prompt-building agent (Haiku) + the current reader message.
4. **Call the conversation agent** — Send the assembled prompt to Claude Sonnet 4.6 via the Anthropic API with streaming enabled.
5. **Stream the response** — Relay the Anthropic stream as Server-Sent Events to the frontend. The reader sees tokens arriving in real time.
6. **Persist the exchange** — Once the stream completes, append the new exchange (reader message + full agent response) to the session blob and write it back. If this is exchange 9+, the prompt-building agent also generates a summary for this exchange.

---

## Prompt Structure

The prompt sent to Sonnet 4.6 is assembled from three blocks:

```
┌─────────────────────────────────────┐
│  Block 1: Concept Instruction Doc   │  ← prompt-cached (1-hour TTL)
│  (full content file, unchanged)     │
├─────────────────────────────────────┤
│  Block 2: Conversation Context      │  ← raw exchanges (1–8) or
│                                     │     Haiku-constructed context (9+)
├─────────────────────────────────────┤
│  Block 3: Current Reader Message    │  ← the message just sent
└─────────────────────────────────────┘
```

**Block 1** is the same for every exchange within a concept and across sessions. Prompt caching means it is sent every time but only billed on the first call (or after the cache expires). This block contains the full per-concept instruction document: argument skeleton, tone, role, provocative questions, success criteria — everything the author wrote.

**Block 2** changes every exchange:
- Exchanges 1–8: all prior exchanges included verbatim. No AI processing needed.
- Exchange 9+: the prompt-building agent (Haiku) reads the full session blob and constructs a context block — selecting relevant prior exchanges and summarising older ones. This keeps the prompt within manageable size while preserving conversational coherence.

**Block 3** is always the raw reader message.

---

## The Prompt-Building Agent

A separate concern from the conversation endpoint, but called by it.

- **Model:** Claude Haiku
- **Activated:** Only from exchange 9 onward. Before that, context construction is mechanical (just append raw exchanges).
- **Input:** The full session blob (all exchanges with their summaries).
- **Output:** A context block — a mix of summarised older exchanges and verbatim recent exchanges — ready to be inserted as Block 2.
- **Persistence:** After each exchange (from exchange 9+), the prompt-building agent also writes a summary of the new exchange back into the session blob, so future calls have summaries available.

The prompt-building agent deserves its own component design document — this section defines only the interface between it and the conversation endpoint.

---

## Session Blob Structure

Stored in Netlify Blobs, keyed by session ID.

```json
{
  "conceptSlug": "architecture-as-source",
  "createdAt": "2026-03-09T14:23:00Z",
  "lastActiveAt": "2026-03-09T14:45:00Z",
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

- `exchanges` is an ordered array. New exchanges are appended.
- `summary` may be null for early exchanges (1–8) if no summarisation has run yet. The prompt-building agent populates summaries retroactively on its first activation (exchange 9).
- `lastActiveAt` is updated on every exchange and used to determine session expiry.

---

## API Contract

**Endpoint:** `POST /.netlify/functions/conversation`

**Request body:**
```json
{
  "sessionId": "uuid-string",
  "conceptSlug": "architecture-as-source",
  "message": "The reader's message text"
}
```

**Response:** SSE stream (`Content-Type: text/event-stream`)

```
data: {"token": "The"}
data: {"token": " agent"}
data: {"token": " responds"}
data: {"token": "..."}
data: {"done": true}
```

**Error response:** If the function fails before streaming begins, it returns a standard HTTP error. If the stream breaks mid-response, the connection closes — the frontend handles this by showing the baked-in error message.

---

## What This Component Does NOT Do

- **Does not manage sessions.** The session ID comes from the frontend. This function does not create, validate, or expire sessions — it simply uses the session ID as a blob key.
- **Does not enforce exchange limits.** The 25-exchange cap is enforced client-side. This function processes whatever it receives.
- **Does not generate the opening message.** The agent's opening line comes from the per-concept instruction document and is rendered by the frontend without an API call.
- **Does not handle the session-end agent.** Session-end processing (full session summary, extracting valuable contributions) is a separate function triggered independently.

---

## Open Questions

1. **Prompt caching mechanics** — How exactly does Anthropic's prompt caching work with Netlify Functions? Each function invocation is stateless, so the cache must be managed by the Anthropic API side (keyed by content hash). Needs verification during implementation.
2. **Blob write contention** — If the reader sends a second message before the first exchange finishes persisting, the blob could be overwritten. In practice this is unlikely (the reader waits for the response), but worth noting.
3. **Prompt-building agent latency** — From exchange 9 onward, there is an extra Haiku call before the Sonnet call. How much latency does this add? Acceptable if under ~1 second.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
