# AGENTS.md — functions

Firebase Cloud Functions backend: HTTP callable endpoints and Firestore document triggers.

## Build

```bash
npm run build          # One-shot build
npm run build:watch    # Watch mode for development
```

Requires `utils` to be built first (`cd ../utils && npm run build`).

## File conventions

| Pattern | Purpose |
|---------|---------|
| `<entity>.endpoints.ts` | Firebase callable functions (HTTP endpoints) |
| `<entity>.utils.ts` | Business logic called by endpoints/triggers |
| `<entity>.utils.test.ts` | Tests for business logic |
| `stages/<type>.endpoints.ts` | Stage-specific endpoints |
| `stages/<type>.utils.ts` | Stage-specific business logic |
| `triggers/<type>.triggers.ts` | Firestore document change triggers |

All endpoints and triggers are exported from `src/index.ts`.

## Trigger system

Triggers in `src/triggers/` fire on Firestore document changes. See `src/triggers/README.md` for the full list.

Key triggers:
- `onParticipantCreated` — Initialize stage answers, start agent participant calls
- `onParticipantUpdated` — Complete current stage and advance to next
- `onPublicChatMessageCreated` — Fan out to all agent mediators + agent participants in the cohort
- `onPrivateChatMessageCreated` — Fan out to mediators for private chat stages
- `mirrorPresenceToFirestore` — Sync Realtime Database presence to Firestore for auto-transfer

## Agent (LLM) system

Two agent types:
- **Agent mediators** — Chat-only facilitators with per-stage prompt configs. Defined at experiment level under `agentMediators/`.
- **Agent participants** — Full experiment participants that auto-progress through all stages. Triggered by participant profile updates.

### Key files

- `agent.utils.ts` — `processModelResponse()`: calls LLM API, writes log entries, handles retries
- `agent.endpoints.ts` — `testAgentConfig` endpoint for API key validation
- `agent_participant.utils.ts` — `completeStageAsAgentParticipant()`: stage-by-stage agent progression
- `chat/chat.agent.ts` — `createAgentChatMessageFromPrompt()`: initial messages, API calls, shouldRespond logic, trigger log deduplication
- `structured_prompt.utils.ts` — Builds structured prompts from prompt configs, stage context, and conversation history
- `api/ai-sdk.api.ts` — Vercel AI SDK v6 integration: provider registry, model selection, structured output, retry logic

### Provider registry (`api/ai-sdk.api.ts`)

Uses a factory pattern — each provider maps to a model factory:

```
PROVIDER_REGISTRY: google → @ai-sdk/google
                   vertex → @ai-sdk/google-vertex
                   openai → @ai-sdk/openai (supports custom baseURL for Groq, OpenRouter, etc.)
                   anthropic → @ai-sdk/anthropic
                   ollama → ollama-ai-provider-v2
```

Adding a new provider: `npm install @ai-sdk/<provider>`, add one entry to `PROVIDER_REGISTRY`, map `ApiKeyType` in `API_TYPE_TO_PROVIDER`.

### API key resolution

`getExperimenterData()` in `utils/firestore.ts` fetches the experiment creator's keys from `experimenterData/{email}`, with fallback to admin default keys from `settings/defaultApiKeys`.

## Data access

- `utils/firestore.ts` — Firestore read helpers (get experiment, participant, stage, cohort, chat messages, trigger logs, etc.)
- `data.ts` — Data export functions (`createExperimentDownload`, `createCohortDownload`, `createParticipantDownload`)
- Never write raw Firestore calls in endpoint files — use the helpers.

## Variables system

`variables.utils.ts` handles variable generation and resolution:
- `generateVariablesForScope()` — Creates variable values for experiment/cohort/participant scope
- `resolveStringWithVariables()` — Resolves Mustache templates against merged variable context
- Supports `STATIC`, `RANDOM_PERMUTATION`, and `BALANCED_ASSIGNMENT` variable types

## Testing

```bash
npm test
```

Requires Java 21 for the Firebase emulator. Integration tests (`*.integration.test.ts`) are slower — they start the full emulator suite.

## REST API

`src/dl_api/` contains Express-based REST API endpoints with bearer token auth and rate limiting. Swagger documentation is auto-generated. The Python client in `scripts/deliberate_lab/` consumes this API.
