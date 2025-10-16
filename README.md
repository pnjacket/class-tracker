# Classroom App

A simple Angular application that lets you manage multiple **Class** objects, each with its own grid of seats. Students can be added to cells, have configurable counters, and all data persists in the browser's `localStorage`.

---

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
- [License](#license)

---

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

---

## Project Structure (relevant files)
```
src/app/
│   app.ts                     # Main component (standalone), UI logic & state management
│   app.html                   # Template with class selector, grid, dialogs, and drag‑drop bindings
│   models.ts                  # Interfaces: Student, Cell, ClassRoom, ClassView
│   utils.ts                    # Tiny UUID helper used throughout the app
│   services/storage.service.ts# Load/save all classes to localStorage
│   counter-dialog/
│       counter-dialog.component.ts  # Modal for editing counters (increment/decrement)
```
Other notable files:
- `angular.json` – Angular CLI configuration.
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
The `StorageService` stores a JSON array under the key **`classroom-app-data`** in the browser's `localStorage`. Each entry corresponds to a `ClassRoom` object with its own grid, views (dates), and student information. Deleting a class removes it from this array.

---

## Extending / Customizing
- **Add more counters**: extend the `counters` map in `Student`, update the dialog template (`counterKeys`).
- **UI improvements**: replace prompt‑based dialogs with Angular Material components for a richer experience.
- **Backend persistence**: swap out `StorageService` implementation to use an API or server‑side database.
- **Additional criteria handling**: modify `editCriteria()` logic to enforce validation rules.

---

## Contributing
Contributions are welcome! Please fork the repository, make your changes, and submit a pull request. If you plan to add significant features, consider opening an issue first for discussion.

---

## License
This project is released under the MIT License (see `LICENSE` file if present).

---

*Generated on 2025‑10‑16 by Goose (Block’s open‑source AI assistant).*
