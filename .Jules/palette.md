## 2024-05-23 - Accessibility Anti-Patterns in Settings Panel
**Learning:** Found interactive toggles implemented as `div`s with `onClick`, lacking keyboard support and screen reader roles. Also, many form inputs lacked associated labels.
**Action:** Always check interactive custom components for semantic HTML (`<button>`) and standard ARIA attributes (`aria-pressed`, `aria-label`) rather than just relying on visual cues.

## 2025-02-18 - Icon-only buttons lacking accessible names
**Learning:** Found multiple icon-only buttons (Pencil, Eraser, etc.) in `SpritePreview` relying solely on `title` attributes, which is insufficient for screen readers.
**Action:** Ensure all icon-only buttons have explicit `aria-label` attributes, and use `aria-pressed` for toggle states.
