
# PixelForge AI Coding Guidelines

## 1. Tech Stack & Core Philosophy
- **Framework**: Vite + React 19 (TypeScript).
- **Styling**: Tailwind CSS + Custom Fantasy CSS Classes.
- **Theme**: "Strict Retro Authenticity". The application must feel like an arcane artifact or a 90s developer terminal.
- **AI Integration**: Use Google GenAI SDK (`@google/genai`) for all generative tasks.

## 2. Architecture (Separation of Concerns)
- **Domain (`domain/`)**: 
  - Contains pure business logic, `entities.ts` (interfaces), `constants.ts`, and orchestrators.
  - **Rule**: No UI code (JSX) allowed in this directory.
- **UI (`ui/`)**: 
  - `ui/components/`: Presentational components.
  - `ui/hooks/`: View logic and state management (`usePixelForge.ts`).
- **Data (`data/`)**: 
  - Services for APIs (`geminiService.ts`), persistence (`repository.ts`, `db.ts`), and image processing.
  - **Rule**: Direct DOM manipulation (except Canvas) is discouraged here.
- **Workers (`workers/`)**: 
  - Heavy image encoding/decoding tasks (GIF, ZIP generation).

## 3. Strict Typing Rules
- **No `any`**: Explicitly define types for all variables and function returns.
- **Entities**: Always import shared types/interfaces from `domain/entities.ts`.
- **Props**: Define clear `interface Props` for every React component.

## 4. Visual Language & Styling
- **Headers**: Always use `fantasy-font` (Cinzel) with `uppercase tracking-widest`.
- **Data/Technical**: Always use `terminal-font` (VT323) or `font-mono`.
- **Lore/Body**: Use `font-serif` (Crimson Text).
- **Palette**:
  - `amber-*`: Primary interaction/Gold.
  - `stone-*`: Backgrounds/Structure.
  - `emerald-*`: Success/Active State.
  - `red-*`: Error/Destructive.
  - `sky-*`: Magic/AI Actions.
- **Borders**: All cards must use `fantasy-card` class or specific border colors (e.g., `border-amber-900/50`).

## 5. Persistence & Performance
- **Storage**: Use `IndexedDB` (via `data/db.ts`) for all user generated assets. `localStorage` is restricted to small configuration flags only.
- **Canvas**: Use `OffscreenCanvas` in services/workers where supported.
- **Assets**: Always treat `base64` strings as expensive; prefer `Blob` or `ImageBitmap` for internal processing.
