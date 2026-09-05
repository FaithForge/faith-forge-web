# Faith Forge Web AI Guide

## Project Context

- This is a **Vite 6 + React 18** Single Page Application (SPA) with client-side routing powered by **React Router DOM 6** under `src/views` and composed in `src/App.tsx`.
- The codebase is TypeScript-first, uses strict types, and employs modern Tailwind CSS v4.
- Prefer the `@/` path alias for imports from `src/*`.
- State is managed via **Redux Toolkit** and **Redux Persist** (with persisted auth, active meeting, and catalog master data).
- Route views are code-split and loaded asynchronously using `React.lazy()` with `<Suspense fallback={<PageLoader />}>`.
- PWA capabilities are provided by `vite-plugin-pwa`, with auto-update, version check polling (`versionCheck.ts`), and chunk recovery (`appCache.ts`).
- Thermal printing uses native Web Bluetooth Low Energy (BLE) with ESC/POS binary command generation (`escposBuilder.ts`) and an extensible driver interface (`IBluetoothPrinterDriver`).
- Master catalog endpoints (campuses, meetings, kid groups, medical conditions, printers) use Redux `condition` guards and HTTP in-memory caching to eliminate redundant 304 network requests.

## Code Style

- Use single quotes in source files.
- Keep TypeScript strict and avoid `any` unless there is a clear compatibility reason.
- Prefer small, focused components and hooks over large multi-purpose files.
- Preserve the existing naming patterns in `src/components`, `src/libs`, `src/services`, and `src/views`.
- **Route and URL Naming**: All routes, paths, and URLs MUST be strictly in English (e.g. `/kid-registration/generate-guardian-qr`, `/kid-church/attendance`, `/admin/church-meetings`). NEVER mix Spanish and English in route names or URL paths.
- **Brand Name in User-Facing Copy**: The user-facing app name presented to the end user in UI texts, modals, alerts, and messages is strictly **Iglekids** (and its sub-modules Regikids/Iglekids). NEVER use "Faith Forge" in user-facing copy or modals. "Faith Forge" is only the internal/project codebase name.

## Architecture

- `src/views` owns routing screens and page composition.
- `src/components` contains reusable UI and feature components:
  - `src/components/ui`: Custom shadcn-like primitives (Button, Input, AppDrawer, ConfirmModal, Select, Skeleton, etc.).
  - `src/components/layout`: MainLayout, TopBar, BottomNav, PageLoader, ScrollToTop.
  - `src/components/modal`: Feature modals and bottom drawers.
  - `src/components/common`: ErrorBoundary, NetworkStatusBanner.
- `src/libs` contains shared logic, types, state, and utilities:
  - `src/libs/state/redux`: Slices, thunks, store configuration, and persistence.
  - `src/libs/utils`: HTTP client, Bluetooth printer drivers, date/text formatting, auth/biometrics, cache control.
  - `src/libs/hooks`: Navigation guards, modal controls, and meeting status hooks.
  - `src/libs/models`: TypeScript domain interfaces and Redux entity definitions.
- `src/services` contains specialized API services.

## UI/UX Guidelines

- **Stack**: Vite + React + TypeScript + Tailwind CSS v4 + Radix UI (primitives) + Vaul (bottom sheets) + Framer Motion.
- **NEVER use DaisyUI or React-Vant**: We build our custom UI components following the shadcn/ui pattern.
- **Use custom UI components first**: Before building from scratch, check `src/components/ui/` for existing primitives like `Button`, `ConfirmModal`, `SettingsDrawer`, etc.
- **Component hierarchy**: Custom UI components → Tailwind utilities.
- **Mobile First**: Optimize for touch. Use Vaul for bottom sheets with drag gestures. Intercept `popstate` to prevent accidental back navigations. Use full-width forms.
- **Consistent Form Field Placeholder Colors**: ALL form inputs (`<input>`, `<textarea>`, `<select>`, `Input.tsx`, `Select.tsx`, `SelectSearch.tsx`, `PhoneInput.tsx`, `DatePickerWheel.tsx`, etc.) MUST use the exact same placeholder tone: `placeholder:text-gray-400` (Tailwind Gray 400 / `#9ca3af`). NEVER use darker placeholder tones like `gray-500` or `gray-600` on input fields.

## Build And Test

- Use `npm run build` when a change affects routing, runtime behavior, or static generation.
- Ensure strict TypeScript typing (`tsc`) passes without errors.

## AI Working Rules

- Prefer local, minimal edits over broad refactors.
- Match the surrounding file style instead of reformatting unrelated code.
- When adding new behavior, check whether an existing utility, component, or slice already covers it.
- If a change depends on a repository convention, encode that convention in a file-specific instruction rather than repeating it in chat.
- **NEVER modify API/Service contract parameters**: NEVER rename, remove, add, or alter query parameters, path params, or request payload fields in API calls, services, or thunks (e.g. `registrationChurchMeetingId`) unless the user explicitly requests it. Backend contracts must remain strictly untouched.

## JSDoc Requirement

- Agents should generate or update JSDoc comments for functions when adding or modifying code. Follow the repository's JSDoc format (one-line summary, `@param` tags with types and descriptions, `@returns` with resolved type and description). See `src/libs/utils/http/index.ts` for an example.
