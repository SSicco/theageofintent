# Component: Concept Pages

> **Files:** `concept-1.html` through `concept-6.html`
> **Read this document before writing any code for these components.**

---

## Purpose

One page per concept. Each page delivers a single written article in a clean, readable format. All six pages share an identical template — same structure, same layout, same HTML skeleton. Only the title and article content differ between them.

---

## Page Titles

Each page displays its title at the top of the content area in this format:

| File | Title |
|------|-------|
| `concept-1.html` | Concept 1: Architecture-as-Source |
| `concept-2.html` | Concept 2: The Strategic Probability Engine |
| `concept-3.html` | Concept 3: The Traceable Knowledge Layer |
| `concept-4.html` | Concept 4: The Divergent Success Model |
| `concept-5.html` | Concept 5: The Primacy of Intent |
| `concept-6.html` | Concept 6: The Conversational Medium |

The title is marked up as an `<h1>` tag. It is styled differently from the article body — larger, distinct — via the stylesheet. The exact font and size are decided when testing on the live site.

---

## Content Source

Article content lives in the `/content` folder as source files:

| Source file | Built into |
|-------------|-----------|
| `content/concept-1.md` | `concept-1.html` |
| `content/concept-2.md` | `concept-2.html` |
| `content/concept-3.md` | `concept-3.html` |
| `content/concept-4.md` | `concept-4.html` |
| `content/concept-5.md` | `concept-5.html` |
| `content/concept-6.md` | `concept-6.html` |

The HTML pages do not fetch this content dynamically. The content is written directly into the HTML file at build time.

## Rebuild Workflow

When the author updates an article, the workflow is:

1. Author edits the relevant file in `/content` and saves it
2. Author instructs Claude Code to rebuild the corresponding HTML page
3. Claude Code reads the updated content file and rewrites the HTML page from scratch using this design document as the template specification
4. The previous HTML file is replaced entirely

Claude Code must always read both this design document and the current content file before rebuilding a page. The design document defines the structure; the content file provides the text.

---

## Content Structure

Each article is structured using standard HTML tags. The stylesheet defines how each tag is rendered. The structure within each article follows this hierarchy:

- `<h1>` — Page title (Concept N: Name)
- `<h2>` — Major section headings within the article
- `<h3>` — Sub-section headings where needed
- `<p>` — Body text paragraphs
- `<ul>` / `<li>` — Bullet point lists where used in the article
- `<strong>` — Bold emphasis where used in the article

No other HTML tags are needed for article content in Phase 1.

---

## Visual Layout

The page is divided into two columns side by side:

**Left column:** Navigation sidebar (defined in the Navigation Component document). Fixed width. Always visible on desktop.

**Right column:** Article content area. Fills the remaining horizontal space. The article text sits within a readable column — not stretched to the full width of the content area. Maximum line length is controlled by the stylesheet (`max-width` on the article container) to keep body text comfortable to read. The exact max-width is decided when testing on the live site.

The background of the concept pages is a solid dark colour — not the portrait image used on the landing page. The exact colour is decided when testing on the live site.

---

## Inputs

None. These are static pages. They receive no data and make no requests.

---

## Outputs

A rendered HTML page displaying the full article for that concept.

---

## Behaviour

No interactive behaviour on these pages in Phase 1 beyond the navigation sidebar. The article does not expand, collapse, animate, or respond to user input.

---

## Edge Cases

**Long articles:** Some concepts are substantially longer than others. The layout must handle articles of any length gracefully — the content area scrolls naturally, the sidebar remains in place.

**Long words or headings:** Handled by the stylesheet (`overflow-wrap: break-word`) to prevent horizontal overflow on small screens.

---

## Error Handling

No dynamic behaviour means no runtime errors. These are static files.

---

## Dependencies

- **Navigation Component** — the sidebar is included on every concept page
- **Stylesheet** (`styles.css`) — controls two-column layout, typography, heading styles, reading column width, and responsive behaviour
- **Navigation Script** (`nav.js`) — controls mobile menu open/close

---

*Phase: 1*
*Last updated: March 2026*
*LLM used to build this component: — (not yet built)*
