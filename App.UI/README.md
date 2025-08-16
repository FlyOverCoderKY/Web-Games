# Web-Games (App.UI)

Static React + TypeScript app (Vite) hosting small games: Number Guess and Tic-Tac-Toe.

## Getting Started

1. Install dependencies

```powershell
cd App.UI; npm install
```

2. Start the dev server

```powershell
cd App.UI; npm run dev
```

Open `http://localhost:5173/`.

## Test

Run unit and component tests (Vitest + RTL):

```powershell
cd App.UI; npm test
```

## Build

Create a production build:

```powershell
cd App.UI; npm run build
```

Preview the built app locally:

```powershell
cd App.UI; npm run preview -- --host 127.0.0.1 --port 4173
```

Open `http://localhost:4173/`.

## Deploy

This repo includes:

- Azure Static Web Apps routing config: `public/staticwebapp.config.json`
- GitHub Pages workflow: `.github/workflows/gh-pages.yml`

For GitHub Pages (root): ensure the repo Pages source is set to GitHub Actions.

If deploying under a subpath, set base path at build time:

```powershell
$env:BASE_PATH = "/my-subpath"; npm run build
```

## Games

- Number Guess: Choose difficulty, guess the secret number with warmer/colder hints.
- Tic-Tac-Toe: Play against a heuristic bot; choose who starts, pick X/O, undo/redo.

## Accessibility & Theming

- Theme switcher (light/dark/system) with accessible focus outlines.
- Live regions for status/alerts on game pages.
