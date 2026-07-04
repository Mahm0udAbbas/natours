# Repository Guidelines

## Project Structure & Module Organization

This is a CommonJS Node.js/Express API backed by MongoDB through Mongoose. `server.js` connects to the database and starts the app configured in `app.js`. Keep HTTP concerns separated: route definitions belong in `routes/`, request handlers in `controllers/`, persistence rules and indexes in `models/`, and Zod input schemas in `validators/`. Shared middleware, services, and error helpers live in `middleware/`, `services/`, and `utils/`. Static pages and images are under `public/`; seed datasets and the import utility are under `dev-data/`. Additional design notes belong in `docs/`.

## Build, Test, and Development Commands

- `npm install` installs dependencies (Node.js 24.13 or newer is required).
- `npm start` runs the development server with Nodemon.
- `npm run start:prod` runs with `NODE_ENV=production`.
- `npm run debug` starts the application through `ndb`.
- `npx eslint . --ignore-pattern node_modules` checks JavaScript style.
- `npx prettier --check .` checks formatting.
- `npm test` runs the isolated Jest API suite; `npm run test:coverage` also enforces coverage thresholds.
- `node dev-data/import-dev-data.js --import` loads seed data; `--delete` removes it. Use these commands only against a disposable database.

There is currently no build step.

## Coding Style & Naming Conventions

Use two-space indentation, semicolons, single quotes, and LF line endings, as enforced by Prettier. ESLint extends Airbnb, Prettier, and Node recommendations. Use camelCase for variables and functions, PascalCase for Mongoose models, and descriptive suffixes such as `tourController.js`, `tourModel.js`, and `tourValidators.js`. Keep controllers thin by reusing factory handlers, `catchAsync`, and `AppError`.

## Testing Guidelines

Tests use Jest, Supertest, and an in-memory MongoDB. Place unit and API suites under `tests/unit/` and `tests/integration/` using `*.test.js`. Keep tests independent, assert response and database state, and mock external services such as email.
Coverage thresholds enforce the current baseline; raise them as new routes gain tests, with 80% global coverage as the next target.

## Commit & Pull Request Guidelines

History generally uses short, imperative Conventional Commit-style subjects, especially `feat:`. Prefer consistent forms such as `feat: add tour distance endpoint` or `fix: validate GeoJSON coordinates`. Keep commits focused. Pull requests should explain behavior changes, list verification commands, link relevant issues, and include request/response examples for API changes or screenshots for changes under `public/`.

## Security & Configuration

Copy `.env.example` to `.env`; never commit secrets. Set `DATABASE_LOCAL`, JWT settings, and mail credentials as needed. Confirm the selected database before imports, deletes, index repairs, or migrations.
