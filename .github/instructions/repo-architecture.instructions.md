---
description: 'Use when navigating the repository structure, deciding where new code belongs, or explaining the app architecture.'
applyTo: '**/*'
---

# Repository Architecture

- `src/pages` contains the route entry points and page-level orchestration.
- `src/components` contains reusable feature and UI components.
- `src/libs/common-types` contains constants and shared data contracts.
- `src/libs/models` contains domain models and interfaces.
- `src/libs/state/redux` contains Redux store setup, hooks, slices, and thunks.
- `src/libs/utils` contains shared helpers for auth, dates, navigation, text, themes, and validation.
- `src/services` contains service modules that talk to the backend or encapsulate domain I/O.

## When Adding Code

- Put reusable UI into `src/components`.
- Put domain logic and shared helpers into `src/libs`.
- Put route-specific composition in `src/pages`.
- Put network access in `src/services` unless the feature already has a dedicated thunk or slice pattern.
