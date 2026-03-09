# Component Design — Conversation Endpoint

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Operating rules:** [Working Principles](../working-principles.md) — read before writing any code.

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

1. **Receive request** — The frontend sends the session ID, concept slug, and the reader's message (empty string for the opening exchange).
2. **Read the session blob** — Fetch the conversation history from Netlify Blobs using the session ID as the key. If no blob exists, this is the opening exchange — the agent generates the first message dynamically.
3. **Wait for summariser** — If the summariser agent is still processing the previous exchange, wait for it to finish. The context assembler needs all summaries to exist before it can run. (Only relevant from exchange 10 onward.) In practice, the frontend blocks sending until the previous exchange is fully processed, so this wait should be rare.
4. **Build the prompt** — Two paths:
   - **Exchanges 1–8:** The per-concept instruction document (prompt-cached) + all prior exchanges raw + the current reader message. No AI involvement.
   - **Exchange 9+:** The per-concept instruction document (prompt-cached) + context block assembled by the context assembler agent (Haiku) + the current reader message.
5. **Call the conversation agent** — Send the assembled prompt to Claude Sonnet 4.6 via the Anthropic API with streaming enabled.
6. **Stream the response** — Relay the Anthropic stream as Server-Sent Events to the frontend. The reader sees tokens arriving in real time.
7. **Persist the exchange** — Once the stream completes, append the new exchange (reader message + full agent response) to the session blob and write it back.
8. **Summarise the exchange** — If this is exchange 9+, the summariser agent (Haiku) generates a summary of this exchange and writes it to the blob. This happens after the response is delivered — the reader is already reading, not waiting.

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

## The Prompt-Building Agents

Two separate Haiku agents handle context management, called at different points in the exchange lifecycle:

### Summariser agent
- **When:** Runs *after* each exchange is persisted (from exchange 9 onward). Not on the critical path — the reader is already reading the response.
- **Input:** The completed exchange (reader message + agent response).
- **Output:** A 2–4 sentence summary written to the exchange's `summary` field in the session blob.
- **First activation (exchange 9):** Retroactively summarises exchanges 1–8.

### Context assembler agent
- **When:** Runs *before* the conversation agent (from exchange 9 onward). On the critical path.
- **Input:** The reader's new message, all exchange summaries, and all full exchanges.
- **Output:** A context block ready to be inserted as Block 2.
- **Assembly rules:**
  - Last 4 exchanges: always included verbatim.
  - Older exchanges: included as summaries.
  - Reference detection: if the reader's new message references or revisits something from an older exchange (beyond the last 4), that exchange is pulled in verbatim alongside the summaries.

These agents are split because the context assembler needs summaries to already exist before it can do reference detection. See [Prompt-Building Agents](prompt-building-agent.md) for full design.

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

## Runtime File Access

The conversation endpoint reads instruction files from `content/instructions/{conceptSlug}.md` at runtime. Netlify Functions run in an isolated environment and do not automatically have access to files outside the function bundle.

To make instruction files available at runtime, configure `included_files` in `netlify.toml`:

```toml
[functions]
  included_files = ["content/instructions/**"]
```

The function then reads instruction files using a path relative to the function's execution context. Use `gray-matter` to strip the YAML frontmatter before sending the instruction document content as Block 1 of the prompt.

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
data: {"ready": true}
```

- `{"done": true}` — the agent's response is complete. The frontend can finalise the message display.
- `{"ready": true}` — all post-response processing is complete (exchange persisted, summariser finished if applicable). The frontend can re-enable the input bar. The SSE connection stays open between `done` and `ready` to keep the frontend informed.

**Error response:** If the function fails before streaming begins, it returns a standard HTTP error. If the stream breaks mid-response, the connection closes — the frontend handles this by showing the baked-in error message.

---

## What This Component Does NOT Do

- **Does not manage sessions.** The session ID comes from the frontend. This function does not create, validate, or expire sessions — it simply uses the session ID as a blob key.
- **Does not enforce exchange limits.** The 25-exchange cap is enforced client-side. This function processes whatever it receives.
- **Does not generate the opening message differently.** The opening message is a regular API call — the frontend sends a request with no reader message, and the agent generates the opening dynamically based on the concept instruction document. This is identical to any other exchange, just with an empty reader message.
- **Does not handle the session-end agent.** Session-end processing (full session summary, extracting valuable contributions) is a separate function triggered independently.

---

## Resolved Questions

1. **Prompt caching mechanics** — Anthropic's prompt caching is managed API-side (keyed by content hash). Each Netlify Function invocation is stateless, so the cache works across invocations automatically. **Decision:** Verify during implementation; no design change needed.
2. **Blob write contention** — If the reader sends a message before the previous exchange finishes persisting (or before the summariser finishes), the blob could be in an inconsistent state. **Decision:** The frontend must delay/pause the reader's ability to send a new message until the previous exchange is fully processed (persisted and, from exchange 9+, summarised). The reader can type while waiting, but sending is blocked until ready.
3. **Prompt-building agent latency** — From exchange 9 onward, there is an extra Haiku call before the Sonnet call. **Decision:** Monitor during testing. We proceed with the current design and address latency only if it becomes a problem in practice.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
