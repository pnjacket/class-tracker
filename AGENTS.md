# Repository Guidelines

## Project Structure & Module Organization
```
class-tracker/
├─ src/            # Application source code (Python modules)
├─ tests/          # Unit and integration tests
├─ assets/         # Static files, e.g., images or CSV data used by the app
└─ README.md       # Project overview
```
Keep new modules under `src/` following a clear package layout. Tests that exercise a module should live in a sibling file within `tests/` mirroring the source hierarchy.

## Build, Test, and Development Commands
- **Run the application**: `python -m src.main`
  - Starts the tracker with default configuration.
- **Run tests**: `pytest`
  - Executes all test suites and reports coverage.
- **Check formatting/linting**: `black --check . && flake8 .`
  - Enforces code style and catches common errors.

## Coding Style & Naming Conventions
- Use **4‑space indentation**; no tabs.
- Follow **PEP 8** for line length (max 88 characters) and naming:
  - Modules & packages: `snake_case`
  - Classes: `CamelCase`
  - Functions/variables/constants: `snake_case` (constants in `UPPER_SNAKE_CASE`)
- Run **Black** (`black .`) before committing to ensure consistent formatting.

## Testing Guidelines
- Tests are written with **pytest**; name files `test_*.py` and functions `test_*`.
- Aim for **≥ 80 % coverage**; use `pytest --cov=src` locally to verify.
- Keep tests isolated – mock external services or databases when possible.

## Commit & Pull Request Guidelines
- **Commit messages** follow the conventional style:
  - `<type>(<scope>): <subject>`
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
  - Example: `feat(auth): add JWT login flow`
- Pull requests must:
  - Include a clear description of the change.
  - Reference related issue(s) with `Closes #123`.
  - Pass all CI checks (tests, linting).

## Additional Notes
- **Security**: Do not commit secrets. Use environment variables and `.env.example` for defaults.
- For major architectural changes, add a brief overview in the PR description.
