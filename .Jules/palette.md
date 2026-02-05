## 2024-05-23 - Accessibility Anti-Patterns in Settings Panel
**Learning:** Found interactive toggles implemented as `div`s with `onClick`, lacking keyboard support and screen reader roles. Also, many form inputs lacked associated labels.
**Action:** Always check interactive custom components for semantic HTML (`<button>`) and standard ARIA attributes (`aria-pressed`, `aria-label`) rather than just relying on visual cues.
