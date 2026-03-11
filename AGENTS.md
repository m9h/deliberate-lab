# AGENTS.md — Deliberate Lab

## Architecture

Deliberate Lab is an npm workspaces monorepo with three packages:

```
utils/        → Shared TypeScript types, validation, and stage logic (tsup → ESM + CJS)
functions/    → Firebase Cloud Functions backend (endpoints + Firestore triggers)
frontend/     → Lit Element + MobX web app (Webpack)
firestore/    → Firestore security rules, DB rules, and indexes
docs/         → Jekyll documentation site (GitHub Pages)
scripts/      → Python CLI client, diagnostics, and utilities
```

**Dependency graph:** `utils` is consumed by both `frontend` and `functions`. Always build `utils` first when making type or stage changes.

## Getting started

```bash
nvm use 22          # Node >=22 required (.nvmrc)
npm ci              # Install all workspaces from root — never npm install in subdirectories
./run_locally.sh    # Automated local setup (builds, copies configs, starts emulators + frontend)
```

**Manual startup:**

1. `cd utils && npm run build` (or `npm run build:watch`)
2. `cd functions && npm run build` (or `npm run build:watch`)
3. Copy config files: `.firebaserc.example` → `.firebaserc`, `frontend/firebase_config.example.ts` → `frontend/firebase_config.ts`, `frontend/index.example.html` → `frontend/index.html`
4. `npx firebase emulators:start --import ./emulator_test_config`
5. `cd frontend && npm run start` → `http://localhost:4201`

Emulator UI runs at `http://localhost:4000`. Test accounts are pre-configured in `emulator_test_config/`.

## Build and CI

- **Linting/formatting:** Prettier + ESLint; enforced via `lint-staged` + Husky pre-commit hook. `@typescript-eslint/no-explicit-any` is an error.
- **CI:** `.github/workflows/ci.yaml` runs on PRs — checks formatting, builds all packages, runs tests, and verifies generated schemas are up to date.
- **Deployment:** `cloudbuild.yaml` with `_DEPLOYMENT_TYPE` controlling what deploys (`test`, `functions`, `frontend`, `rules`, `indexes`, `all`).
- **Health check:** `npm run doctor` from root verifies Node version, dependencies, config files, and builds.

## Stage system

Experiments are composed of ordered "stages" (chat, survey, ranking, asset allocation, etc.). Adding a new stage type touches all three workspaces:

| Workspace | Files to create/modify |
|-----------|----------------------|
| `utils/src/stages/` | `<type>_stage.ts`, `<type>_stage.validation.ts`, `<type>_stage.manager.ts`, `<type>_stage.prompts.ts` |
| `functions/src/stages/` | `<type>.endpoints.ts`, `<type>.utils.ts` |
| `frontend/src/components/stages/` | Config, preview, and answer components |

Register new stages in `utils/src/stages/stage.ts` (enum + types) and `utils/src/stages/stage.handler.ts` (handler registration).

## Database

Cloud Firestore with hierarchical structure:

```
experiments/{experimentId}
  ├── stages/{stageId}                          → StageConfig
  ├── cohorts/{cohortId}
  │   ├── publicStageData/{stageId}             → StagePublicData
  │   │   ├── chats/{messageId}                 → ChatMessage (group chat)
  │   │   └── triggerLogs/{logId}               → Agent trigger dedup
  │   └── ...
  ├── participants/{participantId}
  │   ├── stageData/{stageId}                   → StageParticipantAnswer
  │   │   ├── privateChats/{messageId}          → ChatMessage (private chat)
  │   │   └── triggerLogs/{logId}
  │   └── ...
  ├── agentMediators/{agentId}
  │   └── prompts/{stageId}                     → MediatorPromptConfig
  ├── agentParticipants/{agentId}
  │   └── prompts/{stageId}                     → ParticipantPromptConfig
  └── alerts/{alertId}
experimenterData/{email}                         → API keys, preferences
experimenters/{email}                            → Public profile
settings/defaultApiKeys                          → Admin fallback API keys
```

## Testing

Each workspace has its own `npm test`. Functions tests require Java 21 for the Firebase emulator. Run `npm run update-schemas` after changing types in utils to regenerate TypeScript and Python schemas.

## Key conventions

- All shared types live in `utils/` — never duplicate type definitions in `frontend/` or `functions/`.
- Firestore writes happen only in `functions/` (Cloud Functions). The frontend reads via subscriptions and writes via callable endpoints.
- Use SASS variables from `frontend/src/sass/` for styling — never hardcode colors or spacing.
- Experiment templates are defined in `frontend/src/shared/templates/` and registered in the gallery.
