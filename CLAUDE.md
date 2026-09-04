# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

CICLA is a local-first React Native (Expo) app implementing the **Symptothermal Method (STM)** of fertility charting: basal body temperature, cervical mucus, and (optionally) cervix position. All data stays on-device (SQLite); there is no backend. The STM algorithm (Triple Thermic Shift Rule + Peak Day Rule) is implemented as pure domain logic — no ML, no predictions beyond the documented method rules. Code comments and domain vocabulary are in Spanish; keep new comments/docs consistent with that unless told otherwise.

Note: README.md's tech table still says WatermelonDB — that was replaced by **Drizzle ORM + SQLite** (see `src/data/database/schema.ts` header comment: WatermelonDB was dropped because it isn't reliable under the RN New Architecture). Trust the code/AGENTS.md over the README for stack details.

## Commands

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run lint:fix
npm run format         # prettier --write .
npm run format:check
npm test               # jest (domain + data layer tests only, see below)
npm run test:watch
npx drizzle-kit generate   # generate SQL migrations from src/data/database/schema.ts
```

Run a single test file: `npx jest __tests__/domain/usecases/CalculateFertilityStatusUseCase.test.ts`
Run by name: `npx jest -t "STM-005"`

Jest only runs `__tests__/**/*.test.ts` under a plain Node environment (no RN/jest-expo preset yet — that gets added when component/ViewModel tests arrive in a later phase). Domain tests run in-memory; data-layer tests spin up a real in-memory SQLite DB via `@libsql/client` (see `__tests__/helpers/testDatabase.ts`) using the same Drizzle schema as the app — never mock the DB for repository tests.

## Architecture: layered/clean architecture with an ESLint-enforced dependency rule

`src/` is split into `domain/`, `data/`, `presentation/`, `infrastructure/`, `shared/`. The dependency direction is enforced by `no-restricted-imports` rules in [eslint.config.js](eslint.config.js), not just convention — an architectural violation is a lint error, not a style nit:

- **`domain/`** — pure business logic. Cannot import React, React Native, Expo, WatermelonDB, zustand, or any of `data/`, `presentation/`, `infrastructure/`. Contains:
  - `entities/` — immutable domain types (`Cycle`, `CycleDay`, `FertilityStatus`, `DomainError`, `CervicalMucus`). Entities never mutate; they're replaced.
  - `repositories/` — `I*Repository` interfaces only (contracts). `Observable` from `rxjs` is imported **as a type only** so the domain can express reactivity without depending on WatermelonDB/any concrete reactive store.
  - `usecases/` — the actual STM algorithm and app operations (`CalculateFertilityStatusUseCase`, `DetectPeakDayUseCase`, `DetermineBaselineTemperatureUseCase`, `GetCycleStatisticsUseCase`, `LogDailyEntryUseCase`, `StartNewCycleUseCase`, `GetCurrentCycleUseCase`, `AnalyzeCurrentCycleUseCase`). Each exposes an `I*UseCase` interface + class implementing it, constructor-injected with its dependencies (other use cases / repos) so tests can substitute fakes.
- **`data/`** — implements the domain repository interfaces on Drizzle + SQLite. Cannot import from `presentation/`.
  - `database/schema.ts` — Drizzle table defs (`cycles`, `cycleDays`) + raw `CREATE TABLE IF NOT EXISTS` statements applied at startup (`applySchema`). No versioned migrations yet (drizzle-kit migrations arrive in a later hardening phase) — schema changes today mean editing the raw SQL in `SCHEMA_STATEMENTS` to match the Drizzle table defs.
  - `database/client.ts` — the **only** file in `data/` that touches a native module (`expo-sqlite`); tests must never import it — they use `__tests__/helpers/testDatabase.ts` (libsql in-memory) instead, against the same schema.
  - `database/changeBus.ts` — a tiny pub/sub (`DatabaseChangeBus`) that repositories `emit()` after every write; `observe*()` methods on repos subscribe to it to build RxJS `Observable`s. This is the entire reactivity mechanism — the app is single-process/local-first, so there's no need for native change listeners.
  - `mappers/` — `CycleMapper` / `CycleDayMapper` convert between Drizzle rows and domain entities (`toDomain` / `toPersistence`).
  - `repositories/` — `Drizzle*Repository` classes implementing the domain interfaces. Every method wraps work in try/catch and returns `Result` (never throws); write methods call `changeBus.emit()` on success.
- **`presentation/`** — stores (zustand vanilla, not React-bound) and viewmodels. Cannot import `data/` or WatermelonDB directly — they only talk to domain use cases.
  - `stores/*Store.ts` — `create*Store(deps)` factories returning `StoreApi<State>` from `zustand/vanilla`. Stores hold state and call use cases; they contain **no business logic** (that's the ESLint-adjacent "R03" rule referenced in comments). `createAppStores.ts` wires the three stores (`cycle`, `logEntry`, `settings`) together; actual repo→usecase→store wiring happens in `app/_layout.tsx` (not yet built — Fase 4).
  - `viewmodels/select*ViewModel.ts` — pure functions `(state, settings, today) => DisplayData` that format domain data for a specific screen (e.g. `selectHomeViewModel`, `selectCycleChartViewModel`, `selectLogEntryViewModel`). No business logic, just derivation/formatting (dates, temperature units, phase → label/color via `fertilityPresentation.ts`, error → user message via `errorPresentation.ts`).
  - `components/` (atoms/molecules/organisms, not yet built) may only talk to stores/viewmodels — never DB, use cases, or repositories directly.
- **`shared/`** — `types/common.ts` (the `Result<T, E>` pattern, see below), `constants/stmConstants.ts` (every STM magic number lives here, never inline it), `utils/dateUtils.ts`, `utils/temperatureUtils.ts`.
- **`infrastructure/`** — notifications and backup/export (currently empty stubs, not yet implemented).

### Conventions that matter

- **`Result<T, E>` everywhere fallible**: domain/data functions return `{success, value}` or `{success, error}` (see `src/shared/types/common.ts`) instead of throwing. Use `ok()`/`err()`/`isOk()`/`isErr()`. `DomainError` (`src/domain/entities/DomainError.ts`) is a plain data object with a `code` (`VALIDATION_ERROR`, `NOT_FOUND`, `PERSISTENCE_ERROR`, ...), never thrown as an exception.
- **Immutable entities**: all entity fields are `readonly`; nothing is mutated in place.
- **No magic numbers for STM math**: thresholds/day-counts live in `STM` (`src/shared/constants/stmConstants.ts`) and are referenced by name (e.g. `STM.TEMP_RISE_THRESHOLD`), not inlined.
- **Path aliases**: `@domain/*`, `@data/*`, `@shared/*`, `@stores/*`, `@viewmodels/*`, `@components/*`, `@infrastructure/*` — defined in both `tsconfig.json` and `jest.config.js` (`moduleNameMapper`); keep them in sync if you add a new one.
- **TS strictness**: `tsconfig.json` enables `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` — optional fields must be omitted (not set to `undefined`) and array/index access is typed as possibly-`undefined`.

## Expo version note

Per [AGENTS.md](AGENTS.md): this project is on Expo SDK 57, which changed significantly from earlier SDKs. Check the versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo-related code — don't rely on older/cached Expo knowledge.
