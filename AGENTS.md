# AGENTS.md — Faith Forge Web

Vite 6 + React 18 SPA, TypeScript (strict), Tailwind CSS v4, React Router DOM 6 (views in `src/views`, composed in `src/App.tsx`), Redux Toolkit + Redux Persist + RTK Query, PWA (`vite-plugin-pwa`), Web Bluetooth ESC/POS printing.

## Hard Rules (never violate)

1. **API contracts are frozen.** NEVER rename, add, remove, or alter query params, path params, or payload fields in API calls/services/thunks (e.g. `registrationChurchMeetingId`) unless the user explicitly asks.
2. **Routes and URLs are English only** (e.g. `/kid-church/attendance`, `/admin/church-meetings`). Never mix Spanish and English in paths.
3. **Never write "Faith Forge" in user-facing copy.** It is only the internal codebase name.
4. **No hardcoded Spanish strings in new UI.** Use `useTranslation()`; church-configurable terms come from `useChurchTerm` / `useMinistryTerm` / `useKidsTerm`.
5. **No new server-state code outside RTK Query.** No new `createAsyncThunk`, no new slices for server data.
6. **No `active: boolean` on entities.** Every entity in `src/libs/models` has `state`; compare with `EntityState.ACTIVE` (or the entity's enum extending `...EntityState`). Soft-delete = `state: EntityState.DELETED`.
7. **Never use DaisyUI or React-Vant.** Use `src/components/ui/` primitives first, then Tailwind utilities.
8. **Independent async operations use `Promise.all`.**
9. **Form placeholders are exactly `placeholder:text-gray-400`** (never `gray-500` / `gray-600`).
10. **WhatsApp always uses `FaWhatsapp`** from `react-icons/fa6`, never Lucide message icons.

## Read the matching skill BEFORE starting these tasks

| Task | Read first |
|---|---|
| Fetching or mutating server data, touching a thunk or data slice | `.agents/skills/rtk-query-migration/SKILL.md` |
| Any visible text, new view/modal/drawer, church/ministry terms | `.agents/skills/i18n-terminology/SKILL.md` |
| Building UI: forms, icons, TopBar/layouts, mobile behavior | `.agents/skills/ui-consistency/SKILL.md` |
| Finishing a task / preparing a commit (version bump + changelog) | `.agents/skills/release-changelog/SKILL.md` |

## Code Style

- Single quotes. Strict TypeScript; avoid `any` unless there is a clear compatibility reason.
- Use the `@/` alias for imports from `src/*`.
- Small, focused components and hooks. Follow existing naming in `src/components`, `src/libs`, `src/services`, `src/views`.
- One-line guard clauses have NO braces; braces only for multiline blocks or `else` / `else if`:
  ```ts
  if (!open) return null;
  ```
- JSDoc on every function you add or modify: one-line summary, `@param` (type + description), `@returns` (type + description). Example: `src/libs/utils/http/index.ts`.
- Prefer local, minimal edits. Match surrounding style; no broad refactors or unrelated reformatting. Check for an existing utility/component/hook before writing new code.

## Architecture

- `src/views`: routing screens, lazy-loaded with `React.lazy()` + `<Suspense fallback={<PageLoader />}>`.
- `src/components/ui` (primitives), `layout` (MainLayout, TopBar, BottomNav, PageLoader, ScrollToTop), `modal`, `common` (ErrorBoundary, NetworkStatusBanner).
- `src/libs/state/redux` (store, slices; `api/` = RTK Query: `baseApi`, `kidChurchApi`, `churchApi`), `src/libs/utils` (HTTP client, printer drivers, formatting, auth, cache, offline queue), `src/libs/hooks`, `src/libs/models`.
- `src/services`: specialized API services.

## Verify

- `tsc` must pass with zero errors. Run `npm run build` when a change affects routing, runtime behavior, or static generation.
- `bash scripts/check-ai-rules.sh` must pass before finishing.
