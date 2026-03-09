# Component: Landing Page

> **File:** `index.html`
> **Read this document before writing any code for this component.**

---

## Purpose

The entry point to the website. Its job is to orient the visitor — who made this, what it is, and why it exists — and invite them into the series. Nothing more.

---

## Content

The landing page displays exactly the following text, in this order:

```
The Age of Intent

A place where we explore the effects of AI on our society

A personal website by Sicco Steenhuisen
```

No other text content. No article excerpts, no concept summaries, no calls to action beyond the navigation sidebar.

---

## Visual Layout

The page has two layers:

**Background layer:** A full-screen image of the author — an AI-altered portrait, stylized as an android. The image fills the entire viewport. File location: `assets/portrait.jpg`. The image should be centred and cover the full screen at all screen sizes (`object-fit: cover`).

**Foreground layer:** The text content and navigation sidebar sit above the background image. A dark overlay (`background: rgba(0,0,0,0.5)` or similar) is applied over the portrait to ensure the text is always readable regardless of the image's brightness. The exact opacity of this overlay is to be decided when testing on the live site.

**Text position:** The three lines of text are centred horizontally and vertically on the page, overlaid on the portrait. The navigation sidebar sits to the left as on all other pages.

---

## Inputs

None. This is a static page. It receives no data and makes no requests.

---

## Outputs

A rendered HTML page visible in the browser.

---

## Behaviour

The page has no interactive behaviour beyond the navigation sidebar (which is defined in the Navigation Component design document). The background image does not move, animate, or respond to scrolling.

---

## Edge Cases

**Image not loaded:** If `portrait.jpg` fails to load, the background falls back to a solid dark colour so the text remains readable. This is handled in the stylesheet via a `background-color` on the same element as the background image.

**Very small screens:** The text remains centred and readable. Font size adjustments for small screens are handled in the stylesheet.

---

## Error Handling

No dynamic behaviour means no runtime errors. The only failure mode is a missing asset (`portrait.jpg`) which is handled by the CSS fallback described above.

---

## Dependencies

- **Navigation Component** — the sidebar is included on this page
- **Stylesheet** (`styles.css`) — controls background image, overlay, text positioning, and responsive behaviour
- **Navigation Script** (`nav.js`) — controls mobile menu open/close
- **Asset** (`assets/portrait.jpg`) — the background portrait image, provided by the author

---

*Phase: 1*
*Last updated: March 2026*
*LLM used to build this component: — (not yet built)*