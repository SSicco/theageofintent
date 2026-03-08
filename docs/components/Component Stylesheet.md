# Component: Stylesheet

> **File:** `styles.css`
> **Read this document before writing any code for this component.**

---

## Purpose

A single CSS file linked on every page. Responsible for all visual styling across the entire site: layout, typography, colours, spacing, responsive behaviour, and interactive states. No other CSS files exist. All styling decisions are made here.

---

## What This Document Specifies

Some values in this document are fixed — they are decisions already made and must be implemented exactly. Others are marked **[TO BE DECIDED ON LIVE SITE]** — Claude Code should implement a sensible default for these and the author will adjust them after seeing the site rendered in the browser.

---

## Layout

### Desktop (screen width > 768px)

The page is divided into two columns side by side:

| Column | Width | Behaviour |
|--------|-------|-----------|
| Sidebar | 250px — fixed | Does not scroll. Stays in place as the reader scrolls the article. Positioned fixed to the left edge of the viewport. |
| Content area | Remaining width (viewport minus 250px) | Scrolls normally with the page. |

The content area has a left margin of exactly 250px to prevent it from sitting behind the fixed sidebar.

### Mobile (screen width ≤ 768px)

- The sidebar is hidden by default (`display: none`)
- The content area fills the full screen width — the 250px left margin is removed
- The hamburger icon is visible in the top left corner
- When the Navigation Script adds the class `sidebar-open` to the sidebar, the sidebar becomes visible as an overlay on top of the content area
- The overlay sidebar sits above the content (high `z-index`) and covers the left portion of the screen

---

## The Responsive Breakpoint

The switch between desktop and mobile layout happens at **768px**. Below this width, mobile rules apply. Above it, desktop rules apply.

```
@media (max-width: 768px) {
  /* mobile rules here */
}
```

---

## Sidebar Styling

- Width: **250px**
- Position: fixed, left edge, full viewport height
- Background: dark colour **[TO BE DECIDED ON LIVE SITE]**
- The site title link ("The Age of Intent") at the top is styled larger or more prominently than the concept links
- Active link: the link for the current page is visually distinct from the others — different colour or weight **[TO BE DECIDED ON LIVE SITE]**
- Link hover state: subtle visual feedback on hover **[TO BE DECIDED ON LIVE SITE]**
- Padding inside the sidebar: comfortable spacing between links **[TO BE DECIDED ON LIVE SITE]**

---

## Landing Page Styling

- Background: the portrait image (`assets/portrait.jpg`) fills the full viewport — `background-size: cover`, `background-position: center`
- Fallback background colour if the image fails to load: a solid dark colour **[TO BE DECIDED ON LIVE SITE]**
- A dark overlay sits between the image and the text to ensure readability: `background: rgba(0,0,0,0.5)` — the exact opacity **[TO BE DECIDED ON LIVE SITE]**
- The three lines of text are centred both horizontally and vertically in the viewport
- Text colour on the landing page: white or near-white to contrast against the dark overlay

---

## Concept Page Styling

- Background: solid dark colour — distinct from the sidebar background but consistent with the overall palette **[TO BE DECIDED ON LIVE SITE]**
- The article content sits in a centred readable column within the content area
- Maximum line length: `max-width` applied to the article container to keep body text comfortable to read **[TO BE DECIDED ON LIVE SITE — suggested starting point: 700px]**
- The article container has horizontal padding so text does not touch the edges on narrow screens

---

## Typography

All font decisions are **[TO BE DECIDED ON LIVE SITE]**. No external fonts are loaded in Phase 1. The stylesheet uses the system font stack:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

The following elements must be styled distinctly from each other — exact sizes and weights to be decided on the live site:

| Element | Role |
|---------|------|
| `h1` | Page title — largest, most prominent |
| `h2` | Major section heading within article |
| `h3` | Sub-section heading |
| `p` | Body text — optimised for reading comfort |
| `li` | List items — consistent with body text |
| `strong` | Bold emphasis — inherits body font |
| Navigation links | Sidebar links — distinct from article typography |

Line height for body text (`p`): generous — **[TO BE DECIDED ON LIVE SITE — suggested starting point: 1.7]**

---

## Hamburger Icon

- Visible only on mobile (hidden on desktop via `display: none`)
- Positioned fixed at the top left of the viewport, above the content
- High `z-index` so it remains visible when the sidebar overlay is open
- The icon itself is an inline SVG in the HTML — the stylesheet controls its size, colour, and positioning only

---

## Utility Rules

These rules apply globally:

- `box-sizing: border-box` on all elements — padding and border included in element width calculations
- `overflow-wrap: break-word` on all text elements — prevents horizontal overflow on narrow screens
- `margin: 0`, `padding: 0` reset on `body` and headings — removes browser default spacing before custom values are applied
- Smooth scrolling: `scroll-behavior: smooth` on `html`

---

## Inputs

None. This is a static CSS file.

---

## Outputs

Visual styling applied to all seven pages.

---

## Dependencies

- **Navigation Script** (`nav.js`) — the script adds and removes the class `sidebar-open` on the sidebar element. The stylesheet must define what `sidebar-open` does: makes the sidebar visible as a mobile overlay.

---

*Phase: 1*
*Last updated: March 2026*
*LLM used to build this component: — (not yet built)*