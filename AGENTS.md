# Repository Guidelines

## Project Overview
Angular 20 single-page application for classroom seating and student tracking. All data is stored in the browser's `localStorage` — no backend required. Written in TypeScript with standalone components (no NgModules).

## Project Structure
```
src/app/
├── app.ts / app.html          # Root component (shell); calls store.initialize() on init
├── app.config.ts              # Bootstrap configuration
├── models.ts                  # Interfaces: Student, Cell, ClassRoom, ClassView, Criterion
├── utils.ts                   # uuid() helper
├── components/
│   ├── class-panel/           # Top toolbar: class selector, criteria editor, export/import, chart
│   ├── classroom-grid/        # Main seating grid with drag-and-drop and counter display
│   ├── date-config/           # Date/view selector (add/remove date views)
│   └── grid-config/           # Rows/cols configuration inputs
├── counter-dialog/            # Inline counter increment/decrement modal
├── criteria-editor/           # Modal for managing criteria (counter column definitions)
├── services/
│   ├── class-store.service.ts # Central state hub: all CRUD, counter mutations, export/import
│   ├── storage.service.ts     # localStorage wrapper (versioned at 0.0.2)
│   └── drag-toggle.service.ts # Edit mode toggle (BehaviorSubject + cookie)
└── shared/cookie.util.ts      # getCookie/setCookie helpers
```

## Build, Test, and Development Commands
- **Dev server**: `npm start` – runs at `http://localhost:4200/` with hot-reload.
- **Production build**: `npm run build` – outputs to `dist/classroom-app/`.
- **Run all tests**: `npm test` – Jasmine/Karma tests run headless in ChromeHeadless.
- **Run a single spec**: `npx ng test --include='**/class-store.service.spec.ts' --browsers=ChromeHeadless --no-watch`
- **Lint/format**: Prettier is configured in `package.json` (100-char width, single quotes).

## Key Architecture Rules
- All components are **standalone**; there are no NgModules.
- Components inject `ClassStoreService` directly for all state reads and mutations.
- **Change detection**: After mutating the grid, always reassign `this.activeView.grid = [...this.activeView.grid]` — Angular won't detect nested object mutations.
- Counters/criteria are defined per `ClassView` (date), not per `ClassRoom`.
- Edit mode (add/drag students, import, add dates) is gated by `EditModeService.isEnabled`.
