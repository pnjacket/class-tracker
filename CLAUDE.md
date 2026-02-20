# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200 (hot-reload)
npm run build      # Production build to dist/classroom-app/
npm test           # Run Jasmine/Karma tests headless in ChromeHeadless
```

To run a single spec file, use the Angular CLI directly:
```bash
npx ng test --include='**/class-store.service.spec.ts' --browsers=ChromeHeadless --no-watch
```

Note: The Angular project name is `classroom-app` (not `class-tracker`).

> **Ignore `AGENTS.md`** — it describes a Python/pytest project and does not reflect this codebase.

## Architecture

Single-page Angular 20 app (no router, no NgModules — all standalone components). All data is stored in `localStorage` under key `classroom-app-data`. No backend.

### Three-Layer Structure

**Models** (`src/app/models.ts`) — plain TypeScript interfaces:
- `ClassRoom` → array of `ClassView` (one per ISO date) → `Cell[][]` grid → optional `Student`
- `Criterion` — defines a counter or predefined-value column; lives on each `ClassView`
- `migrateCriteria()` — handles legacy data shapes

**Services** (`src/app/services/`):
- `ClassStoreService` — central state hub; owns all CRUD, drag-and-drop, counter mutations, CSV/JSON export, and data import. All components inject this directly.
- `StorageService` — thin `localStorage` wrapper; versioned at `0.0.2`; backs up old data under a timestamped key on version mismatch.
- `EditModeService` (file: `drag-toggle.service.ts`) — boolean toggle backed by `BehaviorSubject`, persisted in a cookie. Controls whether students can be added/dragged.

**Components** (`src/app/components/`, root `src/app/`):
- `AppComponent` — shell; calls `store.initialize()` on init
- `ClassPanelComponent` — top toolbar: class selector, criteria editor modal trigger, export/import menu, Chart.js trend chart modal
- `DateConfigComponent` — date/view selector with add/remove
- `ClassroomGridComponent` — the main seating grid; handles cell clicks, drag-and-drop, counter display with color coding
- `CriteriaEditorComponent` — modal for managing criteria definitions
- `CounterDialogComponent` — inline counter increment/decrement modal

### Key Design Patterns

- **Change detection**: Mutating operations on the grid must reassign `this.activeView.grid = [...this.activeView.grid]` — Angular won't detect nested object mutations otherwise.
- **Date-cloning**: Adding a new date clones the most recent view's seating and criteria but resets counter values to defaults.
- **Criteria scope**: Criteria live on `ClassView` (per-date), not on `ClassRoom`. The class-level criteria API is a backward-compatible alias.
- **Modal visibility**: No routing; modals are toggled via boolean flags (`showChart`, `showCriteriaEditor`, `showDataMenu`, etc.) on the component.

### Utilities

- `src/app/utils.ts` — `uuid()` using `crypto.getRandomValues`
- `src/app/shared/cookie.util.ts` — `getCookie` / `setCookie` helpers

## Tech Stack

Angular 20 · TypeScript 5.9 · SCSS · Chart.js 4 · RxJS 7.8 · Karma/Jasmine · Prettier (100-char width, single quotes)
