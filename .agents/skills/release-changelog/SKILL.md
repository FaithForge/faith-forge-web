---
name: release-changelog
description: Use when finishing a task or preparing a commit in this app, to bump the version and record the changelog with scripts/bump-version.mjs. Covers one-version-per-day grouping, patch/minor/major choice, and end-user-friendly Spanish wording.
---

# Versioning and Changelog

Run when code changes are complete and you are preparing the commit:

```bash
node scripts/bump-version.mjs --type=<patch|minor|major> --title="Título sencillo" --change="Punto 1 claro" --change="Punto 2 claro"
```

It keeps `package.json`, `src/data/changelog.json`, and the `APP_VERSION` constant in sync.

## One version per working day

Never bump per prompt, small tweak, or commit. All changes from the same day/session are grouped under ONE version. If today already has an entry in `src/data/changelog.json`, add to it instead of creating another.

## Choosing the type

- `patch` (3.0.0 → 3.0.1): bug fixes, UI adjustments, minor visual improvements, field formatting, speed fixes.
- `minor` (3.0.0 → 3.1.0): new screens, new visual components (modals, drawers), new compatible tools or flows.
- `major` (3.0.0 → 4.0.0): global visual redesign, breaking changes, rewrite of core modules.

## Wording (end users: parents, volunteers)

Write in simple, concise Spanish. NO technical terms (refactor, endpoint, slice, thunk, props, payload, hook) and NO internal or database mechanics (base account roles, operational roles, superadmin, call sync). Describe only the visible benefit or general improvements.

- Correct: "Mayor rapidez y fluidez al ingresar a la aplicación." / "Correcciones y mejoras visuales en la navegación."
- Incorrect: "Se excluyó la cuenta base de usuario del selector para que servidores solo vean roles operativos."
