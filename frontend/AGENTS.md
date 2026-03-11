# AGENTS.md — frontend

Lit Element + MobX single-page web application, built with Webpack.

## Build

```bash
npm run start          # Dev server at localhost:4201 (hot reload)
npm run build:prod     # Production build
```

Requires `utils` to be built first. Copy config files before first run:
- `firebase_config.example.ts` → `firebase_config.ts`
- `index.example.html` → `index.html`

## Component architecture

Components are in `src/components/`, organized by feature area (17 subdirectories):

| Directory | Purpose |
|-----------|---------|
| `experiment_builder/` | Creating and editing experiments (stage configs, agent prompts) |
| `experiment_dashboard/` | Managing running experiments (cohorts, participants, monitoring) |
| `participant_view/` | What participants see during an experiment |
| `stages/` | Stage-specific UI components (~87 files) — config, preview, and answer per stage type |
| `chat/` | Chat stage rendering (messages, input, typing indicators) |
| `gallery/` | Experiment template gallery and quickstart cards |
| `settings/` | Settings page (API keys, color mode, account) |
| `shared/` | Reusable components (model selector, dialogs, editors) |
| `header/` | App header and navigation |
| `login/` | Authentication flow |
| `admin/` | Admin panel for managing experimenters |
| `sidenav/` | Side navigation |
| `popup/`, `progress/`, `avatar_picker/`, `participant_profile/`, `experimenter/` | Specialized UI components |

### Pair components (`src/pair-components/`)

Reusable primitive UI components: `button`, `textarea`, `icon`, `icon_button`, `tooltip`, `menu`, `info_popup`. These wrap Material Web components with consistent styling. See `README.md` in that directory for usage.

## Service layer (`src/services/`)

MobX-based services provide reactive state management:

| Service | Purpose |
|---------|---------|
| `firebase.service.ts` | Firestore subscriptions and data access |
| `auth.service.ts` | Firebase auth, experimenter data, API key management |
| `experiment.service.ts` | Current experiment state and subscriptions |
| `experiment.editor.ts` | Experiment creation/editing state (largest service) |
| `experiment.manager.ts` | Experiment management actions (cohorts, participants, agents) |
| `participant.service.ts` | Participant session state |
| `participant.answer.ts` | Stage answer submission |
| `router.service.ts` | Client-side routing |
| `settings.service.ts` | User preferences (color mode) |
| `cohort.service.ts` | Cohort state and subscriptions |
| `home.service.ts` | Home page experiment list |
| `presence.service.ts` | Participant presence detection |
| `analytics.service.ts` | Usage analytics |

Services are registered in `src/core/core.ts` and accessed via `core.getService(ServiceClass)`.

## Styling

- Material 3 Design via SASS variables in `src/sass/`
- `_colors.scss` — Color tokens (use CSS custom properties like `--md-sys-color-primary`)
- `_common.scss` — Layout mixins (`flex-row`, `flex-column`, `chip`) and spacing variables (`$spacing-xs` through `$spacing-xxl`)
- `_typescale.scss` — Typography mixins (`title-large`, `body-medium`, `label-small`, etc.)
- `pair-components/shared.css` — Base component styles
- **Never hardcode colors or spacing** — always use SASS variables and mixins

## Routing

`src/services/router.service.ts` handles client-side routing. Main entry point is `src/app.ts` which renders based on the current route.

## Stage components

Each stage type in `src/components/stages/` typically has:
- `*_config.ts` — Experimenter-facing stage configuration UI
- `*_preview.ts` — Stage preview in experiment builder
- `*_answer.ts` or `*_view.ts` — Participant-facing stage UI

## Experiment templates

Templates in `src/shared/templates/` define pre-built experiment configurations. Register new templates in the gallery component (`src/components/gallery/`).
