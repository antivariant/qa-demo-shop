# Database Management System

This system provides a set of scripts to manage Firestore data across development, test, and production environments.

## 1. Synchronization (Prod → Target)
Used to keep `test` and `dev` environments up-to-date with production-like reference data.

**Command:**
```bash
# Sync to Test
npm run db:sync:test

# Sync to Dev (Emulator)
npm run db:sync:dev
```

**Behavior:**
- **Additive ONLY**: It checks if a document exists in the target. If it does, it skips it.
- **Scope**: Only `categories`, `products`, `pricelist`.
- **Environment**: Reads `SOURCE_PROJECT_ID` (Prod) and `TARGET_PROJECT_ID` (Test/Dev) via `.env`.

## 2. Base Seeding (Destructive Reset)
Used for initial set up of a new environment or resetting a corrupted one.

**Command:**
```bash
npm run db:seed:base
```

**Behavior:**
- **Destructive**: It **CLEARS** the target collections before loading data.
- **Scope**: Only `categories`, `products`, `pricelist`.
- **Source**: JSON files in `scripts/db/data/`.
- **Env**: Uses `FIREBASE_PROJECT_ID` from current environment (defaults to `.env.dev` via `npm run seed:dev`).

## 3. Emulator Snapshots
Used to persist and restore the full state of the Firestore emulator between sessions.

**Save current state:**
```bash
npm run db:snapshot:save
```
Exports all collections (Reference + Runtime) to `scripts/db/snapshots/dev`.

**Load last state:**
```bash
npm run db:snapshot:load
```
Starts the emulator and automatically imports Reference + Runtime data from `scripts/db/snapshots/dev`.

---

## Technical Details
- **Idempotency**: Sync scripts are safe to re-run.
- **Constraints**: No `add()` calls; all document IDs are deterministic.
- **Security**: Sync scripts require local `GOOGLE_APPLICATION_CREDENTIALS` for production access.
