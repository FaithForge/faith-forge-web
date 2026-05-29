# Faith Forge Web AI Guide

## Project Context

- This is a Next.js 14 project that uses the Pages Router under `src/pages`.
- The codebase is TypeScript-first and uses React 18.
- Prefer the `@/` path alias for imports from `src/*`.
- Keep changes consistent with the existing Redux, PWA, and component-driven structure.

## Code Style

- Use single quotes in source files.
- Keep TypeScript strict and avoid `any` unless there is a clear compatibility reason.
- Prefer small, focused components and hooks over large multi-purpose files.
- Preserve the existing naming patterns in `src/components`, `src/libs`, `src/services`, and `src/pages`.
- Do not convert the project to the App Router unless explicitly requested.

## Architecture

- `src/pages` owns routing and page composition.
- `src/components` contains reusable UI and feature components.
- `src/libs` contains shared logic, types, state, and utilities.
- `src/services` contains API and domain service functions.

## Build And Test

- Use `npm run lint` before merging changes that touch shared code.
- Use `npm run build` when a change affects routing, runtime behavior, or static generation.

## AI Working Rules

- Prefer local, minimal edits over broad refactors.
- Match the surrounding file style instead of reformatting unrelated code.
- When adding new behavior, check whether an existing utility, component, or slice already covers it.
- If a change depends on a repository convention, encode that convention in a file-specific instruction rather than repeating it in chat.

## File-Specific Guidance

- Put reusable TypeScript, React, or Next.js conventions in `.github/instructions/*.instructions.md`.
- Put focused repo exploration behavior in `.github/agents/*.agent.md`.
- Put short reusable task flows in `.github/prompts/*.prompt.md`.

## JSDoc Requirement

- Agents should generate or update JSDoc comments for functions when adding or modifying code. Follow the repository's JSDoc format (one-line summary, `@param` tags with types and descriptions, `@returns` with resolved type and description). See `src/libs/utils/http/index.ts` for an example.
