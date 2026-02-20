# Classroom App

A simple Angular application that lets you manage multiple **Class** objects, each with its own grid of seats. Students can be added to cells, have configurable counters, and all data persists in the browser's `localStorage`.

---

## 🎉 Project Overview

This is a **commercial‑licensed** application, but the entire source code is openly available for anyone to explore. You can test‑drive the live demo at <https://pnjacket.github.io/class-tracker>. If you spot any bugs or have suggestions, please let us know by opening an issue here: https://github.com/pnjacket/class-tracker/issues.


## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Building the Application](#building-the-application)
- [Running the Compiled App](#running-the-compiled-app)
- [Development Server (optional)](#development-server-optional)
- [Testing](#testing)
- [Data Persistence Details](#data-persistence-details)
- [Extending / Customizing](#extending--customizing)
- [Contributing](#contributing)

---

## Features
- Multiple classes – create, rename, delete, and switch between them.
- Configurable grid size per class (rows × columns).
- **Date‑based views** – each class can have multiple seating layouts for different dates. When a new date is added it automatically inherits the current view’s **criteria** (counter definitions) and student counters are reset to their default values (`0` for numeric counters, empty string for predefined ones).
- Add a student name to any empty cell.
- Increment/decrement counters (including negative values) for each student via a modal dialog. Counter values show a light grey background when zero, light red for negatives, and light green for positives. Counters are defined by the **criteria** list attached to a view.
- Drag‑and‑drop students between seats.
- Import/Export a class as JSON, and export all data of a class as CSV (one row per student per view).
- Edit the criteria for the *active* view; counters are added/removed automatically on edit.
- All changes are saved instantly to `localStorage` – reload the page and everything is restored.

---

## Project Structure (relevant files)
```
src/app/
│   app.ts / app.html          # Root component (shell); initialises the store on load
│   models.ts                  # Interfaces: Student, Cell, ClassRoom, ClassView, Criterion
│   utils.ts                   # UUID helper
│   components/
│       class-panel/           # Top toolbar: class selector, criteria editor, export/import, chart
│       classroom-grid/        # Main seating grid with drag-and-drop and counter display
│       date-config/           # Date/view selector (add/remove date views)
│       grid-config/           # Rows × cols configuration inputs
│   counter-dialog/            # Inline counter increment/decrement modal
│   criteria-editor/           # Modal for managing criteria (counter column definitions)
│   services/
│       class-store.service.ts # Central state hub: all CRUD, counter mutations, export/import
│       storage.service.ts     # localStorage wrapper (versioned at 0.0.2)
│       drag-toggle.service.ts # Edit mode toggle (BehaviorSubject + cookie)
│   shared/cookie.util.ts      # getCookie/setCookie helpers
```
Other notable files:
- `angular.json` – Angular CLI configuration (project name: `classroom-app`).
- `package.json` – Project metadata and dependencies.
- `src/main.ts` – Bootstrap entry point.

---

## Installation
```bash
# Clone or copy the repository
git clone <repo-url>  # or copy the folder
cd class-tracker        # <-- root directory of this project
npm install            # installs Angular CLI and all dependencies defined in package.json
```
The `package.json` defines the following runtime dependencies (Angular 20.x, RxJS, etc.).

---

## Building the Application
```bash
npm run build   # Executes `ng build` – produces a production bundle in dist/classroom-app/
```
The build output is placed under `dist/classroom-app/`. The command verifies compilation only; it does **not** start a development server.

---

## Running the Compiled App (no server needed)
You can open the generated `index.html` directly in a browser because all logic runs client‑side and uses `localStorage` for persistence:
```bash
# macOS example
open dist/classroom-app/index.html
# Linux example
xdg-open dist/classroom-app/index.html
# Or simply double‑click the file in your file explorer.
```
No additional backend is required.

---

## Development Server (optional)
If you prefer hot‑reloading while developing, you can run:
```bash
npm start   # Runs `ng serve` – starts a dev server at http://localhost:4200/
```
This launches the Angular development server with live reload. Use this mode only for local development; the production build is still recommended for distribution.

---

## Testing
```bash
npm test   # Executes Jasmine/Karma unit tests defined in src/app/**/*.spec.ts
```
The repository includes a basic spec file (`app.spec.ts`). Additional tests can be added under `src/app/` following the existing pattern.

---

## Data Persistence Details
The `StorageService` stores a versioned JSON object `{ version, classes }` under the key **`classroom-app-data`** in the browser's `localStorage`. Each entry in `classes` corresponds to a `ClassRoom` object with its own grid, views (dates), and student information. Deleting a class removes it from this array. Legacy plain-array format is still supported on load for backward compatibility. On a version mismatch, the old data is automatically backed up under a timestamped key before migration.

---

## Extending / Customizing
- **Add more counters**: use the **Edit Criteria** button in the UI to add counter or predefined-value criteria, or call `ClassStoreService.updateViewCriteria()` programmatically.
- **UI improvements**: replace prompt‑based dialogs with Angular Material components for a richer experience.
- **Backend persistence**: swap out `StorageService` implementation to use an API or server‑side database.

---

## Contributing

**Contribution Policy**

All contributions submitted to this repository will become the exclusive property of the project owner. By submitting code, documentation, or any other material you irrevocably assign all rights, title, and interest in such contributions to the owner. The owner may incorporate, modify, distribute, and commercialize the contributed work under the project's commercial license. Contributors waive any claim to ownership or royalties.

## License
The project is licensed under the terms described in [LICENSE.md](LICENSE.md).
