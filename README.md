# Classroom App

A simple Angular application that lets you manage multiple **Class** objects, each with its own grid of seats. Students can be added to cells, have configurable counters, and all data persists in the browser's `localStorage`.

## Features
- Multiple classes – create, rename, delete, and switch between them.
- Configurable grid size per class (rows × columns).
- Date‑based *views* – each class can have multiple seating layouts for different dates.
- Add a student name to any empty cell.
- Increment/decrement counters for each student via a modal dialog. Counters are dynamically defined by the **criteria** list.
- Drag‑and‑drop students between seats.
- Import/Export a class as JSON, and export all data of a class as CSV (one row per student per view).
- Edit the list of criteria (counter names) for a class; counters are automatically added/removed on edit.
- All changes are saved instantly to `localStorage` – reload the page and everything is restored.
- Compile‑only verification – we use `ng build` after every major change, never `ng serve`.

## Project structure (relevant files)
```
src/app/
│   app.ts                 # Main component (standalone), UI logic & state management
│   app.html               # Template with class selector, grid, dialogs, and drag‑drop bindings
│   models.ts              # Interfaces: Student, Cell, ClassRoom, ClassView
│   utils.ts               # Tiny UUID helper used throughout the app
│   services/storage.service.ts  # Load/save all classes to localStorage
│   counter-dialog/
│       counter‑dialog.component.ts  # Modal for editing counters (increment/decrement)
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
# macOS example
open dist/classroom-app/index.html
# or double‑click the file in your file explorer
```
Because everything runs client‑side and uses `localStorage`, no web server is required.

## How data is persisted
The service stores a JSON array under the key **`classroom-app-data`** in `localStorage`. Each entry corresponds to a `ClassRoom` object with its own grid, views (dates), and student information. Deleting a class removes it from this array.

## Development & testing
- Run `npm test` to execute the Jasmine/Karma unit tests (`src/app/app.spec.ts`).
- Linting can be added via Angular CLI or ESLint configurations as needed.

## Extending / customizing
- **Add more counters**: extend the `counters` map in `Student`, update the dialog template (`counterKeys`).
- **UI improvements**: replace prompt‑based dialogs with Angular Material components for a richer experience.
- **Backend persistence**: swap out `StorageService` implementation to use an API or server‑side database.
- **Additional criteria handling**: modify `editCriteria()` logic to enforce validation rules.

---
*Generated on 2025‑10‑11 using Goose (Block’s open‑source AI assistant).*
