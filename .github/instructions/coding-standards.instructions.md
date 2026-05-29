---
description: 'Use when editing TypeScript, React, Next.js, Redux, or shared UI code in this repository. Covers code style, imports, and implementation patterns.'
applyTo: '**/*.{ts,tsx,js,jsx,mjs,cjs}'
---

# Coding Standards

- Use the `@/` alias for imports from `src/*` instead of deep relative paths.
- Keep imports grouped and remove unused imports.
- Prefer explicit prop and return types on shared utilities, components, and hooks.
- Preserve the existing React and Redux patterns already used in the repo.
- Keep functions and components small enough to understand without scrolling far.
- Avoid introducing new dependencies when the repo already has a suitable utility.
- Keep object and array shapes aligned with existing models in `src/libs/models`.

## Practical Examples

- Prefer `import { themeVars } from '@/libs/utils/theme';` over long relative paths.
- Prefer reusing existing form, modal, and layout components instead of duplicating UI logic.
- Keep feature-specific logic close to the page or component that owns it.

## JSDoc Policy

- All functions (exported and internal public helpers) should include JSDoc comments following the repository's format. Use the style shown in `src/libs/utils/http/index.ts` as the canonical example: include a one-line summary, `@param` tags for each parameter with types and descriptions, and `@returns` describing the resolved value or thrown errors.

### Example structure

```
/**
 * One-line description of the function's purpose.
 *
 * @param {Type} name - Description of parameter.
 * @returns {Promise<AxiosResponse<any, any>>} - Description of what the promise resolves with.
 */
```
