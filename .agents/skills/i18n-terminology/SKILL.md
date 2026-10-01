---
name: i18n-terminology
description: Use when adding or changing any user-visible text, label, role name, modal, drawer, or view in this app. Covers react-i18next namespaces, the adaptable terminology engine (useChurchTerm/useMinistryTerm), and brand-name rules.
---

# Text, i18n, and Adaptable Terminology

## No hardcoded text in new UI

- Every new view, modal, drawer, or component uses `useTranslation()` from `react-i18next`. Never hardcode Spanish strings in JSX.
- Existing components: migrate their hardcoded strings opportunistically whenever you touch them.

## Namespaces

- Resources live in `src/locales/es/<namespace>.json`.
- `common.json`: cross-cutting actions (`actions.save`, `actions.cancel`, `actions.delete`, ...), global states (`states.loading`, `states.saving`, ...), common dialogs.
- Feature namespaces: `auth.json`, `kidChurch.json`, `admin.json`, etc. Create or extend as needed.
- Every new namespace MUST be registered in `src/libs/i18n/index.ts` under `resources` to keep strict typing and autocomplete (`CustomTypeOptions`).

## Terminology engine

All visible labels, roles, and terms resolve through `useChurchTerm` / `useMinistryTerm` / `useKidsTerm` so each church can customize vocabulary. These are dynamic, NOT static translations. Inject them by interpolation:

```ts
t('select_meeting_prompt', { meeting: meetingTerm.toLowerCase() });
// "select_meeting_prompt": "Selecciona una {{meeting}} para registrar asistencia"
```

Levels:
- **Church**: institutional terms (`meeting`, `campus`, `volunteer`, `small_group`).
- **Ministry**: scoped by `MinistryType`. `GENERAL` uses "Servidor". `KIDS` defaults to "Maestro(a)" (church can set "Servidor(a)", "Tía/Tío", ...); the registration station is configurable (e.g. "Regikids" / "Registro de niños").
- **Service area**: scoped by `MinistryAreaScope`.

## Brand name

The UI shows the module name configured for the church/ministry (default "Ministerio de Niños", suggested alias "Iglekids"). NEVER "Faith Forge" in user-facing copy or modals.
