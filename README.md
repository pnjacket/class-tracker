# Classroom App

A simple Angular application that lets you manage multiple **Class** objects, each with its own grid of seats. Students can be added to cells, have three counters (A/B/C), and all data persists in the browser's `localStorage`.

## Features
- Multiple classes – create, rename, delete, and switch between them.
- Configurable grid size per class (rows × columns).
- Add a student name to any empty cell.
- Increment/decrement three counters for each student via a modal dialog.
- All changes are saved instantly to `localStorage` – reload the page and everything is restored.
- **Compile‑only verification** – we use `ng build` after every major change, never `ng serve`.

## Project structure (relevant files)
```
src/app/
│   app.ts                 # main component (standalone), UI logic
│   app.html               # template with class selector, grid, dialogs
│   models.ts              # interfaces: Student, Cell, ClassRoom
│   utils.ts               # tiny UUID helper
│   services/storage.service.ts  # load/save all classes to localStorage
│   counter-dialog/
│       counter‑dialog.component.ts  # modal for editing counters
```

## Getting started (development)
```bash
# Clone / copy the repository
cd classroom-app
npm install            # installs Angular and dependencies
npm run build          # runs `ng build` – verifies compilation only
```
The command produces a production‑ready bundle in `dist/classroom-app/`.

## Running the compiled app (no server needed)
Open the generated `index.html` directly in a browser:
```bash
open dist/classroom-app/index.html   # macOS example
# or double‑click the file in your file explorer
```
Because everything runs client‑side and uses `localStorage`, no web server is required.

## How data is persisted
The service stores a JSON array under the key **`classroom-app-data`** in `localStorage`. Each entry corresponds to a `ClassRoom` object with its own grid and student information. Deleting a class removes it from this array.

## Extending / customizing
- Add more counters: extend the `counters` map in `Student`, update the dialog template (`counterKeys`).
- Replace the prompt‑based dialogs with Angular Material dialogs for a richer UI.
- Persist data to a backend by swapping out `StorageService` implementation.

---
*Generated on 2025‑10‑11 using Goose (Block’s open‑source AI assistant).*
