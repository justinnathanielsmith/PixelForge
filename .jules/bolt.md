## 2024-05-23 - [JSDOM IndexedDB Mocking]
**Learning:** The project uses `jsdom` for tests but relies on `idb` (IndexedDB wrapper). `jsdom` does not support IndexedDB, and the `idb` library requires `IDBRequest` and other classes to be present on `globalThis`. Simple mocking is not enough; class inheritance is checked (e.g., `instanceof IDBRequest`).
**Action:** When working with `idb` in `jsdom`, ensure full mocking of `IDB*` classes and ensure custom mock requests inherit from `IDBRequest`.

## 2024-05-23 - [Canvas Creation in Render Loop]
**Learning:** `SpritePreview.tsx` was creating multiple DOM `canvas` elements every frame (60fps) inside `requestAnimationFrame` loop via `renderFrame` and `imageProcessingService.processFrame`. This causes significant GC pressure.
**Action:** Reuse canvas instances using `useRef` and pass them to processing functions to avoid allocation in hot paths.

## 2024-05-24 - [List Rendering Performance in Modals]
**Learning:** `GalleryModal` rendered large lists of `GeneratedArt` items without memoization. Passing inline arrow functions to `onClick` caused all items to re-render on any state change (like selection).
**Action:** Always extract list items into `React.memo` components and use `useCallback` for handlers when rendering large lists, especially in interactive modals.
