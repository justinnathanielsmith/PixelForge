
## 2025-05-23 - Accessibility Anti-Patterns in Settings Panel
**Learning:** Found interactive toggles implemented as `div`s with `onClick`, lacking keyboard support and screen reader roles. Also, many form inputs lacked associated labels.
**Action:** Always check interactive custom components for semantic HTML (`<button>`) and standard ARIA attributes (`aria-pressed`, `aria-label`) rather than just relying on visual cues.

## 2025-02-18 - Icon-only buttons lacking accessible names
**Learning:** Found multiple icon-only buttons (Pencil, Eraser, etc.) in `SpritePreview` relying solely on `title` attributes, which is insufficient for screen readers.
**Action:** Ensure all icon-only buttons have explicit `aria-label` attributes, and use `aria-pressed` for toggle states.

## 2025-02-20 - Modal Close Buttons & Tab Navigation
**Learning:** Consistently found modal "Close" (×) buttons missing `aria-label`, making them ambiguous to screen readers. Also, custom tab navigations (`div` + `button`s) often lack `role="tablist"`/`tab` semantics.
**Action:** Standardize `aria-label="Close [Modal Name]"` on all modal close buttons. Enforce `role="tablist"` and `aria-selected` on custom tab components.

## 2025-02-23 - Interactive Card Patterns
**Learning:** Nested interactive elements (buttons inside clickable divs) violate accessibility and HTML rules.
**Action:** Use a "stacked" approach: Place a full-size, invisible `<button>` (positioned absolute) behind other interactive elements to handle the primary card action. Ensure focus states are visible via `focus-within` or explicit focus handling.

## 2025-02-26 - Button Groups for Selection
**Learning:** Grids of buttons used for single-selection (like resolution presets) lacked grouping semantics, making it impossible for screen readers to understand the context or current selection.
**Action:** Wrap selection button grids in a container with `role="group"` (or `radiogroup`) and `aria-labelledby`. Use `aria-pressed` (or `aria-checked`) on the buttons to indicate state.

## 2025-05-24 - Async Button Feedback
**Learning:** Found critical action buttons (like "Batch Export") lacked visual feedback during processing, leaving users unsure if the action succeeded or failed silently.
**Action:** Always implement loading states (`disabled` + spinner + text change) on buttons triggering async operations. Ensure `aria-busy` is set for screen readers.

## 2025-05-24 - File Upload Accessibility
**Learning:** Found file upload trigger implemented as a `div` with `onClick`, blocking keyboard access. Critical inputs (Prompt) lacked labels.
**Action:** Use `<button type="button">` for upload triggers. Ensure primary inputs have `aria-label` if visual labels are absent.
