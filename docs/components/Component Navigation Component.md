# Component: Navigation Component

> **Included in:** Every HTML page (`index.html`, `concept-1.html` through `concept-6.html`)
> **Read this document before writing any code for this component.**

---

## Purpose

A fixed left sidebar that allows the reader to navigate between all seven pages of the site. It is identical on every page — the same HTML block copied into each file. On desktop it is always visible. On mobile it is hidden by default and opened by tapping the hamburger icon.

---

## Content

The navigation sidebar contains the following links in this order:

| Label | Links to |
|-------|----------|
| The Age of Intent | `index.html` |
| Concept 1: Architecture-as-Source | `concept-1.html` |
| Concept 2: The Strategic Probability Engine | `concept-2.html` |
| Concept 3: The Traceable Knowledge Layer | `concept-3.html` |
| Concept 4: The Divergent Success Model | `concept-4.html` |
| Concept 5: The Primacy of Intent | `concept-5.html` |
| Concept 6: The Conversational Medium | `concept-6.html` |

"The Age of Intent" at the top is the site title and links back to the landing page. It is styled differently from the concept links — larger or more prominent — to distinguish it as the home link.

The currently active page is visually indicated — the link for the page the reader is currently on is highlighted differently from the others. This is handled via a CSS class added to the active link in each page's HTML.

---

## Visual Layout

**Desktop (screen width > 768px)**
- Fixed left sidebar, always visible
- Does not scroll with the page content — stays in place as the reader scrolls the article
- Width: defined here as the single source of truth — **250px**
- Background: dark, distinct from the content area but consistent with the overall colour scheme

**Mobile (screen width ≤ 768px)**
- Sidebar hidden by default
- A hamburger icon (☰) is visible in the top left corner of every page
- Tapping the icon opens the sidebar as an overlay on top of the content
- The icon changes to a close icon (✕) when the sidebar is open
- Tapping the close icon or navigating to a page closes the sidebar

---

## The Hamburger Icon

The icon is an inline SVG written directly in the HTML. No icon library. It displays as three horizontal lines (☰) when the menu is closed and an X (✕) when the menu is open. The toggle between the two states is handled by the Navigation Script.

---

## Inputs

None. The navigation component is static HTML. It receives no data.

---

## Outputs

A rendered sidebar visible on every page.

---

## Behaviour

**Desktop:** No behaviour beyond rendering. The sidebar is always visible.

**Mobile:** The hamburger icon listens for a tap. On tap, the Navigation Script adds a CSS class to the sidebar that makes it visible. A second tap removes the class and hides it again. The Stylesheet defines what the class does visually.

**Active page indication:** Each HTML page manually adds a CSS class (e.g. `class="active"`) to its own link in the navigation block. This is set at build time, not dynamically. When Claude Code builds or rebuilds a page, it must set the correct link as active in that page's navigation block.

---

## Edge Cases

**Reader is on the landing page:** The "The Age of Intent" link at the top is marked active. Clicking it does nothing visible but is not an error.

**Sidebar open on mobile, reader taps a link:** The reader navigates to the new page. The sidebar is hidden by default on the new page load — it does not carry its open state across pages.

---

## Error Handling

No dynamic behaviour beyond the open/close toggle. No error states.

---

## Dependencies

- **Stylesheet** (`styles.css`) — controls sidebar width (250px), fixed positioning, mobile hide/show, overlay behaviour, active link styling
- **Navigation Script** (`nav.js`) — controls the open/close toggle on mobile

---

*Phase: 1*
*Last updated: March 2026*
*LLM used to build this component: — (not yet built)*