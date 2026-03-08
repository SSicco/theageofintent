# Dependencies — The Age of Intent Website

> **This document logs all external resources and the LLM version used to build each component. It must be updated every time a new component is built or an external resource is added. This is the "requirements.llm" file described in Concept 1 (Architecture-as-Source).**

---

## External Dependencies

### Phase 1

None. The Phase 1 site is entirely self-contained. No external libraries, no fonts loaded from third-party services, no icon libraries.

| Resource | Type | URL | Reason |
|----------|------|-----|--------|
| — | — | — | No external dependencies in Phase 1 |

**Typography:** System fonts only. The browser uses whatever sans-serif font the reader's device has installed. No external font loading.

**Icons:** The hamburger menu icon is an inline SVG written directly in the HTML. No icon library required.

**Note on styling:** Visual style (typography, colour palette, spacing) will be tested and decided on the live site after Phase 1 is built. If external fonts are introduced at that point, this document must be updated before any code changes are made.

---

## LLM Version Log

Every component must have an entry here when it is built. If a component is rebuilt or significantly modified, add a new entry rather than replacing the old one. This log is what makes the codebase reproducible from the design documents alone.

| Component | File(s) | LLM Version | Date | Notes |
|-----------|---------|-------------|------|-------|
| Design documents | `docs/*.md` | claude-sonnet-4-6 | March 2026 | Project Overview, System Map, Working Principles, Dependencies |
| Landing Page | `index.html` | — | — | Not yet built |
| Concept Pages | `concept-1.html` through `concept-6.html` | — | — | Not yet built |
| Stylesheet | `styles.css` | — | — | Not yet built |
| Navigation Script | `nav.js` | — | — | Not yet built |

---

## Rules for This Document

- Never add an external dependency without updating this document first
- If you are considering adding a dependency, stop and ask the author — there may be a self-contained alternative
- When a component is built, fill in its row in the LLM Version Log immediately
- If the LLM version changes mid-project, note it — do not silently update

---

*Phase: 1*
*Last updated: March 2026*
*LLM used in this session: claude-sonnet-4-6*