# Component: Navigation Script

> **File:** `nav.js`
> **Read this document before writing any code for this component.**

---

## Purpose

A single small JavaScript file with one responsibility: listen for a tap or click on the hamburger icon and toggle the sidebar open or closed on mobile. Nothing else lives in this file.

---

## Behaviour

When the hamburger icon (☰) is clicked:
- If the sidebar is closed — add the class `sidebar-open` to the sidebar element, making it visible
- If the sidebar is open — remove the class `sidebar-open` from the sidebar element, hiding it

The Stylesheet defines what `sidebar-open` looks like visually. This script only adds and removes the class — it makes no visual decisions itself.

---

## Inputs

A click or tap event on the hamburger icon element.

---

## Outputs

The class `sidebar-open` added to or removed from the sidebar element.

---

## Edge Cases

**Reader navigates to a new page while sidebar is open:** The sidebar is not open on the new page — each page loads fresh with the sidebar hidden by default. No state is carried between pages.

**Script loads before the HTML elements exist:** The script is loaded at the bottom of the HTML body, after the sidebar and hamburger icon elements exist in the page. This prevents the script from running before the elements it references are available.

---

## Error Handling

No error states. If the script fails to load entirely, the sidebar simply cannot be opened on mobile — the rest of the page remains fully functional.

---

## Dependencies

- **Navigation Component** — provides the sidebar element and the hamburger icon element that this script listens to
- **Stylesheet** (`styles.css`) — defines the visual behaviour of the `sidebar-open` class

---

## Implementation Note

The script is loaded via a `<script src="nav.js"></script>` tag placed at the bottom of the `<body>` in every HTML file, after all other elements.

---

*Phase: 1*
*Last updated: March 2026*
*LLM used to build this component: — (not yet built)*