## Web-Games – Implementation Plan (Static React App)

This plan defines phased, incremental work an AI agent can execute to deliver a static React site with a home page listing available games and dedicated pages for each game.

Scope for initial release: Number Guess, Tic-Tac-Toe.

### Tech stack
- React + TypeScript (Vite template already present under `App.UI`)
- React Router for client-side routing
- CSS modules or plain CSS to match existing styles in `App.UI/src`
- Testing: Vitest + React Testing Library for unit/component tests
- Optional: Playwright for minimal E2E flows

### High-level structure
- `App.UI/src/routes.tsx` – route map
- `App.UI/src/pages/HomePage.tsx` – game index
- `App.UI/src/games/number-guess/*` – Number Guess UI + logic
- `App.UI/src/games/tic-tac-toe/*` – Tic-Tac-Toe UI + logic
- `App.UI/src/lib/*` – shared utilities (RNG, scoring helpers)
- `App.UI/src/types/*` – shared types/enums
- `App.UI/src/components/*` – reusable UI components

## Base Prompt - Please work on Phase # tasks from the plan.md do the items one at a time and mark them off in the plan doucment when done.

## Phase 0 – Baseline and environment
- [x] Confirm Vite app runs locally
  - [x] `cd App.UI && npm i && npm run dev`
- [x] Ensure `ThemeContext`/header/footer render without errors
- [x] Add base dependencies

```bash
cd App.UI
npm i react-router-dom
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**DoD**
- App starts, header/footer visible, no console errors
- Test runner executes an empty test successfully

## Phase 1 – Routing, layout, navigation
- [x] Create route map
  - [x] `/` → `HomePage`
  - [x] `/games/number-guess` → Number Guess
  - [x] `/games/tic-tac-toe` → Tic-Tac-Toe
  - [x] `*` → NotFound page
- [x] Wire routes in `App.tsx` using `BrowserRouter`
- [x] Ensure `AppHeader` has nav links to Home and each game
- [x] Add `NotFoundPage`

**DoD**
- Direct navigation between all routes works and page titles update

## Phase 2 – Home page (game index)
- [x] Create `HomePage` with a card grid listing available games
  - [x] Data-driven source `src/games/catalog.ts` with: id, title, description, difficulty, route, status
  - [x] Each card links to its game page
  - [x] Include small icons from `public/*.png` when available
- [x] Add basic responsive layout (2–3 columns desktop, 1 column mobile)

**DoD**
- Game catalog renders deterministically from `catalog.ts`
- Keyboard navigation and focus states function correctly

## Phase 3 – Shared utilities and components
- [x] `src/lib/random.ts`: seedable RNG wrapper using `mulberry32` or `seedrandom`
  - [x] Seed via query param `?seed=` when present; fallback to `crypto.getRandomValues`
- [x] `src/lib/format.ts`: helpers for small text messages
  - Implement pluralize, ordinal, range, score, list, capitalize, elapsed time helpers
  
// Mark complete
- [x] `src/lib/format.ts`: helpers for small text messages
- [x] `src/components/UI/`: Button, TextInput, Card, Grid, Toggle/Select
- [x] `src/types/common.ts`: shared enums and types

**DoD**
- Utilities are unit-tested and tree-shakeable

## Phase 4 – Number Guess (per Games.md)
Functional mapping from console to web:
- Difficulty selector replaces CLI `--difficulty`
- Optional seed via query param `?seed=`; UI may expose a dev toggle to set seed
- Replace CLI prompts with form inputs and on-screen messages

### Domain
- [x] `Difficulty` enum: Easy(1–50), Normal(1–100 default), Hard(1–500)
- [x] Range mapping and secret selection via RNG
- [x] State: secret, attemptCount, previousDistance, bestScore (persist in `sessionStorage`), running flag
- [x] Scoring: `difficultyBonus = floor(log2(R))`; `score = max(1, attempts*100 - difficultyBonus)`

### UI/UX
- [x] Page layout with: difficulty select, start/reset, input for guess, submit button
- [x] Validation messages (empty, non-int, out-of-range)
- [x] Hints: Too low/high; from second guess, prefix `Warmer!`/`Colder!` when distance shrinks/grows
- [x] Success flow: show attempts, score, best score; “Play again” button re-seeds and resets attempts
- [x] Accessibility: input labeled; error messages `aria-live="polite"`

### Testing
- [x] Unit tests: range mapping, warmer/colder, scoring, best-score update
- [x] Component tests: full round happy path; invalid input handling

**DoD**
- All acceptance rules in Games.md are represented with equivalent web behavior
- Refresh preserves best score within session only

## Phase 5 – Tic-Tac-Toe (per Games.md)
Functional mapping from console to web:
- In-UI controls replace CLI options: who starts (human/bot), human mark (X/O), swap marks
- Undo/redo via buttons; unlimited within session

### Domain
- [x] Types: `Cell` (`Empty|X|O`), `GameStatus` (`InProgress|XWins|OWins|Draw`), `Move` ({row,col,player})
- [x] `Board` immutable model: 3×3 cells, `currentPlayer`
  - [x] `apply(move)` validates bounds, emptiness, and turn; flips player
  - [x] `getStatus()` checks rows, columns, diagonals; draw when full
  - [x] `getEmptyCells()` returns legal moves
- [x] `HeuristicBot` strategy
  - [x] Win if possible; else block opponent; else center→corners→edges
- [x] History stacks: `history`, `redo`
  - [x] Undo: push current → `redo`, pop from `history`
  - [x] Redo: push current → `history`, pop from `redo`

### UI/UX
- [x] 3×3 clickable grid, shows X/O; disabled cells are inert
- [x] Controls: start/reset; who starts; human mark; swap marks
- [x] Status area: “You win!”, “Bot wins!”, or “Draw.”
- [x] If bot starts, bot moves once immediately and board re-renders before human input
- [x] Errors (occupied/out-of-bounds) are surfaced as toasts or inline messages
- [x] Keyboard support: arrow-key navigation + Enter to place mark; focus ring visible

### Testing
- [x] Unit tests: board rules, status resolution, bot priority, undo/redo semantics
- [x] Component tests: human starts; bot starts; human as O; swap marks

**DoD**
- Matches the behaviors and edge cases enumerated in Games.md

## Phase 6 – Visual polish, accessibility, responsiveness
- [x] Use existing theme toggling; ensure contrast and focus outlines
- [x] Responsive layouts down to 320px; grid collapses to single column
- [x] Announce result and errors with `aria-live` regions

## Phase 7 – Telemetry and error handling (optional)
- [x] Minimal analytics hook (page views only). Keep optional and privacy-friendly
- [x] ErrorBoundary at route-level to avoid full-app crashes

## Phase 8 – CI, tests, and deployment
- [x] Add `npm run test` (vitest config with jsdom)
- [ ] Optional Playwright smoke: load each route, click a few cells
- [x] GitHub Actions workflow for build + test on PRs
- [x] Deploy target: Azure Static Web Apps (config present in `public/staticwebapp.config.json`) or GitHub Pages
  - [x] Ensure Vite `base` configured if hosting under subpath

## Phase 9 – Documentation
- [x] `README.md` updates: run, test, build, deploy instructions
- [x] Each game page has short rules/instructions section

## File and task scaffolding (to create during phases)
- `App.UI/src/routes.tsx` – central router
- `App.UI/src/pages/HomePage.tsx`
- `App.UI/src/pages/NotFoundPage.tsx`
- `App.UI/src/games/catalog.ts` – game metadata
- Number Guess
  - `App.UI/src/games/number-guess/NumberGuessPage.tsx`
  - `App.UI/src/games/number-guess/domain.ts` (enums, scoring, helpers)
  - `App.UI/src/games/number-guess/__tests__/*`
- Tic-Tac-Toe
  - `App.UI/src/games/tic-tac-toe/TicTacToePage.tsx`
  - `App.UI/src/games/tic-tac-toe/domain.ts` (Board, types, bot)
  - `App.UI/src/games/tic-tac-toe/__tests__/*`
- Shared
  - `App.UI/src/lib/random.ts`, `format.ts`
  - `App.UI/src/components/UI/*` (Button, Card, Grid, Select, TextInput)
  - `App.UI/src/types/common.ts`

## Acceptance criteria (global)
- Home lists both games with descriptions and working links
- Number Guess honors difficulty ranges, warmer/colder hints, scoring, and best score in-session
- Tic-Tac-Toe supports human vs. bot, configurable start/marks, undo/redo, and result messaging
- Routing works via direct URL entry (no server rewrites needed for SPA on chosen host)
- Unit tests cover core rules for both games

## Stretch goals (backlog)
- Add Minimax bot option for Tic-Tac-Toe
- Persist best scores across sessions via `localStorage`
- Add third game (e.g., Rock–Paper–Scissors or 2048-lite)
- Shareable URLs including seed/difficulty/settings via query params
- Visual winner-line highlight in Tic-Tac-Toe


