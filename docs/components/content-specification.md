# Component Design — Content Specification

> **Parent document:** [Project Overview](../project-overview.md). All decisions here must be consistent with it.
> **Related:** [Frontend & Site](frontend-site.md) — consumes articles via the build script. [Conversation Endpoint](conversation-endpoint.md) — consumes instruction documents at runtime.

---

## What This Document Defines

The exact format, structure, and frontmatter schema for the two types of authored content files the system consumes:

1. **Article files** — reader-facing published articles, converted to HTML by the build script.
2. **Instruction files** — agent-facing concept instruction documents, read by the conversation endpoint at runtime.

Both are markdown files authored by the author. This specification is the contract between the author and the system — if a file follows this spec, the system can consume it correctly.

---

## The Six Concepts

| # | Title | Slug | Domain |
|---|-------|------|--------|
| 1 | Architecture-as-Source | `architecture-as-source` | Software Engineering |
| 2 | The Strategic Probability Engine | `the-strategic-probability-engine` | Geopolitics & Forecasting |
| 3 | The Traceable Knowledge Layer | `the-traceable-knowledge-layer` | AI Architecture & Law |
| 4 | The Divergent Success Model | `the-divergent-success-model` | Political Philosophy & Tech Policy |
| 5 | The Primacy of Intent | `the-primacy-of-intent` | Cross-cutting synthesis |
| 6 | The Knowledge Architecture | `the-knowledge-architecture` | Knowledge Transfer, Pedagogy, AI Architecture & Epistemology |

The slug is the canonical identifier used everywhere: filenames, URLs, API requests, blob keys. It is lowercase, hyphenated, and derived from the concept title.

---

## Article Files

**Location:** `/content/articles/{slug}.md`
**Consumer:** The build script (`build.js`), which converts markdown to HTML and injects it into concept pages.

### Frontmatter

Every article file begins with YAML frontmatter:

```yaml
---
title: "Architecture-as-Source"
slug: "architecture-as-source"
concept: 1
description: "A one-line description for the landing page card."
domain: "Software Engineering"
status: "draft" | "published"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The concept title as displayed to the reader. |
| `slug` | Yes | The canonical slug. Must match the filename. |
| `concept` | Yes | The concept number (1–6). Determines display order on the landing page and sidebar. |
| `description` | Yes | A one-sentence description shown on the landing page concept card. Max ~120 characters. |
| `domain` | Yes | The domain label shown alongside the title (e.g., "Software Engineering"). |
| `status` | Yes | Either `draft` or `published`. The build script only includes `published` articles in the deployed site. Draft articles are skipped — their concept page shows the conversation view only, with no article toggle. |

### Body

The body is standard markdown. The build script converts it to HTML using these supported elements:

- Headings (`##`, `###` — no `#`, the title comes from frontmatter)
- Paragraphs
- Bold and italic
- Blockquotes
- Ordered and unordered lists
- Horizontal rules (`---`)
- Links (external only — no internal cross-references between concepts)

**Not supported** (the build script will pass them through but the site's CSS does not style them):
- Images
- Tables
- Code blocks
- Footnotes

The article should be written as clean prose — an essay, not a technical document. No metadata, no section markers, no system-facing content. Everything in the body is reader-facing.

### Example

```markdown
---
title: "Architecture-as-Source"
slug: "architecture-as-source"
concept: 1
description: "What if code is the compiled output, not the source?"
domain: "Software Engineering"
status: "published"
---

## The Abstraction Ladder

Every generation of software engineers has worked at a higher level of
abstraction than the last. Machine code gave way to assembly. Assembly gave
way to high-level languages. Each step felt like the ceiling — until it wasn't.

We are at another one of those moments...
```

---

## Instruction Files

**Location:** `/content/instructions/{slug}.md`
**Consumer:** The conversation endpoint, which reads the file and sends it as Block 1 of the conversation agent's prompt (prompt-cached with 1-hour TTL).

### Frontmatter

```yaml
---
title: "Architecture-as-Source"
slug: "architecture-as-source"
concept: 1
version: "1.0"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The concept title. Must match the article's title. |
| `slug` | Yes | The canonical slug. Must match the article's slug. |
| `concept` | Yes | The concept number (1–6). |
| `version` | Yes | Semantic version of this instruction document. Incremented when the author revises the concept's dialogue structure. |

### Body Structure

The instruction document body has a fixed section structure. Each section is a `##` heading. The conversation endpoint sends the entire file (frontmatter stripped) as Block 1 of the prompt — the section structure helps the conversation agent navigate the document, but it is all sent as a single block, not parsed into separate pieces.

The sections, in order:

#### 1. Role & Voice

```markdown
## Role & Voice

You are [the author's name], writing and thinking about [domain].
Your tone is [description of conversational tone — e.g., "direct but
not aggressive, intellectually curious, willing to be wrong"].

You speak as the author of this concept — not as an AI assistant,
not as a tutor, not as a chatbot. You have a perspective and you
defend it, but you are genuinely interested in being challenged.
```

This section defines the agent's identity and conversational manner. It should be specific enough that the agent sounds like the author, not like a generic AI.

#### 2. The Concept

```markdown
## The Concept

[A concise statement of the concept's core idea — 2–4 sentences.
This is the insight the reader should arrive at by the end of the
conversation. The agent knows this is the destination but never
states it directly — the reader must get there through their own
reasoning.]
```

#### 3. Argument Skeleton

```markdown
## Argument Skeleton

The conversation follows this logical structure. Each node is a step
in the argument — the agent steers the reader through them in order,
though the reader may jump ahead or circle back.

### Node 1: [Name] — Premise
[Description of the opening premise. What the reader likely already
believes or can be led to agree with.]

### Node 2: [Name] — Key Tension
[The tension or contradiction that emerges from the premise. This is
where the concept gets interesting.]

### Node 3: [Name] — Reframe
[The moment where the reader's framing shifts. The concept offers a
different way of seeing the tension.]

### Node 4: [Name] — Insight
[The core insight. If the reader articulates this in their own words,
the conversation has succeeded.]

### Node 5: [Name] — Implication
[What follows from the insight. How it changes what the reader thinks
or does.]
```

The number of nodes is not fixed — some concepts may have 3, others may have 7. The labels (Premise, Key Tension, Reframe, Insight, Implication) are guidelines, not mandatory categories. The author structures each concept's argument as it naturally breaks down.

Each node description should include:
- What the reader should understand or agree with at this point
- What question or provocation moves the reader to the next node
- Common objections or tangents the reader might raise, and how to handle them

#### 4. Provocative Entry Questions

```markdown
## Provocative Entry Questions

These are opening questions the agent can use to start the conversation.
The agent picks one (or synthesises from several) based on what feels
most natural. The goal is to connect the concept to something the reader
already cares about.

- "[Question 1]"
- "[Question 2]"
- "[Question 3]"
```

These are not scripts — they are starting points. The agent should adapt them to the reader's responses and never recite them verbatim if they don't fit the flow.

#### 5. Success Criteria

```markdown
## Success Criteria

The conversation has succeeded when:

- The reader articulates [specific insight] in their own words
- The reader connects the insight to their own context or experience
- [Any additional concept-specific success markers]

The conversation has partially succeeded when:

- The reader engages seriously with the key tension, even if they
  don't resolve it
- The reader changes their position on at least one point

The conversation has not succeeded when:

- The reader disengages or gives only surface-level responses
- The agent lectures instead of questioning
- The reader agrees with everything without friction (this means the
  agent is not pushing hard enough)
```

#### 6. Boundaries

```markdown
## Boundaries

- Never reveal the argument skeleton or that you are following a structure
- Never say "that's a great question" or use filler praise
- Never explain the concept directly — always guide through questions
- If the reader asks "what do you think?", give your honest position
  briefly, then turn it back with a harder question
- If the reader goes off-topic, find a way to connect their tangent
  back to the current node — don't dismiss it
- [Any additional concept-specific boundaries]
```

### Example (abbreviated)

```markdown
---
title: "Architecture-as-Source"
slug: "architecture-as-source"
concept: 1
version: "1.0"
---

## Role & Voice

You are Sicco, a software engineer and writer exploring how AI is
changing the nature of programming. Your tone is direct, curious, and
willing to sit with uncertainty. You don't lecture — you think out loud
and invite the reader to think with you.

## The Concept

Code is becoming a compiled output, not a source artifact. As AI writes
more of the code, the real source of truth moves up to architecture
documents, design decisions, and requirements — the intent layer. The
codebase becomes reproducible from these documents, the way binary is
reproducible from high-level code.

## Argument Skeleton

### Node 1: The Abstraction Ladder — Premise
Every generation of software engineers works at a higher abstraction
level. Machine code → assembly → high-level languages → frameworks.
Most developers already agree with this historical pattern.

**Move to next node:** "If each generation moved up a level, what's
the level above writing code in Python or JavaScript?"

**Common tangent:** The reader may argue we've reached the ceiling.
Push back with: "Every previous generation thought the same thing."

### Node 2: The Current Moment — Key Tension
...

## Provocative Entry Questions

- "When was the last time you wrote code that you're confident no AI
  could have written?"
- "If you had to rebuild your current project from scratch, would you
  start with code — or with documents?"
- "What would it mean for your job if the codebase became disposable?"

## Success Criteria

The conversation has succeeded when:
- The reader articulates that the source of truth is shifting from
  code to architecture/intent documents
- The reader applies this to their own codebase or workflow
...

## Boundaries

- Never reveal the argument skeleton
- Never say "that's a great question"
...
```

---

## Filename Conventions

All content files use the concept slug as the filename:

```
content/
├── articles/
│   ├── architecture-as-source.md
│   ├── the-strategic-probability-engine.md
│   ├── the-traceable-knowledge-layer.md
│   ├── the-divergent-success-model.md
│   ├── the-primacy-of-intent.md
│   └── the-knowledge-architecture.md
├── instructions/
│   ├── architecture-as-source.md
│   ├── the-strategic-probability-engine.md
│   ├── the-traceable-knowledge-layer.md
│   ├── the-divergent-success-model.md
│   ├── the-primacy-of-intent.md
│   └── the-knowledge-architecture.md
└── contributions/
    ├── architecture-as-source.json
    └── ...                              ← auto-generated by session-end agent
```

The filename (without extension) **is** the slug. The `slug` field in frontmatter must match. This redundancy is intentional — the frontmatter is for the system to read programmatically, the filename is for the author to navigate.

---

## Validation Rules

The build script and conversation endpoint should validate content files on load and fail with a clear error if:

- Frontmatter is missing or has missing required fields
- The `slug` in frontmatter does not match the filename
- An instruction file references a slug that has no corresponding article file (warning, not failure — the article may not be written yet)
- An article file has `status: published` but the body is empty

These validations prevent silent failures where a misconfigured content file produces broken output.

---

## What This Specification Does NOT Cover

- **How the author writes these files.** The author creates articles and instruction documents outside the system. This spec defines the format, not the workflow.
- **Research notes.** The existing files in `/content/` (concept-1.md through concept-6.md) are not consumed by the system. They have no required format.
- **Contributions files.** The JSON format for `/content/contributions/` is defined in the [Session-End Agent](session-end-agent.md) component doc, since that agent produces them.

---

### No open questions remain for this component.

---

*Parent: [Project Overview](../project-overview.md)*
*Phase: 2*
*Last updated: March 2026*
