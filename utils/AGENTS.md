# AGENTS.md — utils

Shared TypeScript types, validation functions, and utilities. Published as `@deliberation-lab/utils` and consumed by both `frontend` and `functions`.

## Build

```bash
npm run build          # One-shot build (tsup → dist/)
npm run build:watch    # Watch mode for development
```

Always rebuild after changes — `frontend` and `functions` import from the built output. The build produces both ESM and CJS bundles with declaration files.

## File conventions

| Pattern | Purpose |
|---------|---------|
| `<entity>.ts` | Types and creator functions |
| `<entity>.validation.ts` | Validation logic (TypeBox/Ajv schemas) |
| `<entity>.test.ts` | Colocated tests |

### Stage files (`src/stages/`)

Each stage type follows this naming pattern:

| Pattern | Purpose |
|---------|---------|
| `<type>_stage.ts` | Stage config type, creator function, and answer type |
| `<type>_stage.validation.ts` | Validation for stage config and answers |
| `<type>_stage.manager.ts` | `BaseStageHandler` subclass — display logic, prompt generation, answer extraction |
| `<type>_stage.prompts.ts` | Default structured prompts for mediators and agent participants |
| `<type>_stage.utils.ts` | Helper functions specific to this stage type |

**Base/generic stage files:**
- `stage.ts` — `StageKind` enum, `StageConfig` union type, stage creator functions
- `stage.handler.ts` — `BaseStageHandler` abstract class and handler registry
- `stage.manager.ts` — `StageManager` that delegates to registered handlers

### Adding a new stage type

1. Create stage files following the naming pattern in `src/stages/`
2. Add the new `StageKind` variant to the enum in `stage.ts`
3. Add the config type to the `StageConfig` union in `stage.ts`
4. Register the handler in `stage.handler.ts`
5. Run `npm run build` to verify, then update `functions/` and `frontend/` accordingly

## Key modules

- `agent.ts` — Agent persona, model settings, chat settings types
- `experimenter.ts` — `ExperimenterData`, `APIKeyConfig`, API key validation
- `experiment.ts` — `Experiment` type, metadata, variable configs
- `model_config.ts` — Default models and curated model lists per provider
- `providers.ts` — `ApiKeyType` enum, provider-specific option types
- `structured_output.ts` — Structured output schema types and JSON schema conversion
- `variables.ts` — Variable config types (`STATIC`, `RANDOM_PERMUTATION`, `BALANCED_ASSIGNMENT`)
- `variables.template.ts` — Mustache template resolution with variable context merging
- `utils/condition.ts` — Condition evaluation system (comparison operators, AND/OR groups)

## Schema generation

After modifying types, run from the repo root:

```bash
npm run update-schemas
```

This rebuilds utils, exports TypeScript JSON schemas via `src/export-schemas.ts`, generates Python Pydantic models with `datamodel-codegen`, and formats with Black.

## Testing

```bash
npm test
```

Tests are colocated with source files (`*.test.ts`).
