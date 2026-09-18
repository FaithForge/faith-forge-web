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
- **Brand Name in User-Facing Copy**: En la interfaz, cada módulo presenta el nombre que le corresponde según el contexto y la configuración de la iglesia/ministerio (por defecto "Ministerio de Niños" con alias sugerido "Iglekids"). NEVER use "Faith Forge" in user-facing copy or modals. "Faith Forge" is only the internal/project codebase name.
- **Jerarquía y Motor de Nomenclatura Adaptable**:
  - Toda etiqueta, rol y término visible debe resolverse a través del motor de nomenclatura (`useChurchTerm` / `useMinistryTerm`), permitiendo que cada iglesia personalice su vocabulario.
  - **Nivel Iglesia**: Términos institucionales (`meeting`, `campus`, `volunteer`, `small_group`).
  - **Nivel Ministerio**: Scoped por `MinistryType` (`GENERAL` vs `KIDS`). En el contexto de niños, el término predeterminado es `Maestro(a)` (o configurable por la iglesia a `Servidor(a)`, `Tía/Tío`, etc.), y la estación de registro es configurable (ej. `Regikids` / `Registro de niños`). En ministerios generales se usa `Servidor`.
  - **Nivel Área de Servicio**: Scoped por `MinistryAreaScope`.

## Architecture

- `src/views` owns routing screens and page composition.
- `src/components` contains reusable UI and feature components:
  - `src/components/ui`: Custom shadcn-like primitives (Button, Input, AppDrawer, ConfirmModal, Select, Skeleton, etc.).
  - `src/components/layout`: MainLayout, TopBar, BottomNav, PageLoader, ScrollToTop.
  - `src/components/modal`: Feature modals and bottom drawers.
  - `src/components/common`: ErrorBoundary, NetworkStatusBanner.
- `src/libs` contains shared logic, types, state, and utilities:
  - `src/libs/state/redux`: Slices, thunks, store configuration, and persistence.
  - `src/libs/state/redux/api`: RTK Query base and domain APIs (`baseApi`, `kidChurchApi`, `churchApi`).
  - `src/libs/utils`: HTTP client, Bluetooth printer drivers, date/text formatting, auth/biometrics, cache control, offline queue.
  - `src/libs/hooks`: Navigation guards, modal controls, and meeting status hooks.
  - `src/libs/models`: TypeScript domain interfaces and Redux entity definitions.
- `src/services` contains specialized API services.

## State Management Architecture & Progressive RTK Query Migration

- **Separación Estricta de Estado**:
  - **Estado de Servidor (*Server State* - 100% RTK Query)**: Toda petición de lectura (queries) o mutación contra los microservicios vive en `src/libs/state/redux/api/` (`baseApi`, `kidChurchApi`, `churchApi`). Aprovecha el etiquetado declarativo (`tagTypes`), deduplicación de peticiones en vuelo, auto-invalidación, refetch ante reconexión y sincronización de cola offline.
  - **Estado de Cliente y Sesión (*Client State* - Redux Slices)**: Reservado **única y exclusivamente** para preferencias locales del dispositivo y contexto de sesión persistido (`authSlice` con tokens/perfil, `printerModeSlice`, `volunteerContextSlice`, selección activa de reunión/sede). Queda prohibido mezclar lógica de fetching de servidor en estos slices.
- **Regla de Migración Progresiva (Obligatoria para la IA)**:
  - **Flujos y pantallas nuevas**: DEBEN crearse consumiendo directamente los hooks autogenerados de RTK Query (`useGet...Query`, `use...Mutation`). PROHIBIDO crear nuevos `createAsyncThunk` o nuevos slices para datos de servidor.
  - **Flujos y pantallas existentes en mantenimiento**: Cada vez que se actualice o modifique un componente existente, se debe reemplazar progresivamente su `dispatch(Thunk)` y `useAppSelector` de datos por el hook de RTK Query correspondiente.
  - **Extinción ordenada de código heredado**: Una vez que un `*.thunk.ts` o slice de datos deje de tener componentes dependientes, se retirará limpiamente de `store.ts`.


## UI/UX Guidelines

- **Stack**: Vite + React + TypeScript + Tailwind CSS v4 + Radix UI (primitives) + Vaul (bottom sheets) + Framer Motion.
- **NEVER use DaisyUI or React-Vant**: We build our custom UI components following the shadcn/ui pattern.
- **Use custom UI components first**: Before building from scratch, check `src/components/ui/` for existing primitives like `Button`, `ConfirmModal`, `SettingsDrawer`, etc.
- **Component hierarchy**: Custom UI components → Tailwind utilities.
- **Mobile First**: Optimize for touch. Use Vaul for bottom sheets with drag gestures. Intercept `popstate` to prevent accidental back navigations. Use full-width forms.
- **Consistent Form Field Placeholder Colors**: ALL form inputs (`<input>`, `<textarea>`, `<select>`, `Input.tsx`, `Select.tsx`, `SelectSearch.tsx`, `PhoneInput.tsx`, `DatePickerWheel.tsx`, etc.) MUST use the exact same placeholder tone: `placeholder:text-gray-400` (Tailwind Gray 400 / `#9ca3af`). NEVER use darker placeholder tones like `gray-500` or `gray-600` on input fields.
- **Iconografía Consistente por Contexto**: Mantener estrictamente los mismos íconos según el contexto en todas las pantallas y vistas de la aplicación:
  - **WhatsApp**: Toda acción, enlace o botón relacionado con WhatsApp DEBE usar obligatoriamente `FaWhatsapp` de `react-icons/fa6`. Queda estrictamente PROHIBIDO usar íconos de mensajería genéricos (`MessageCircle`, `MessageSquare`, etc.) de Lucide para representar WhatsApp.
  - **Llamadas telefónicas**: Usar consistentemente `Phone` de `lucide-react`.
  - **Niños y niñas**: Usar `FaChild` y `FaChildDress` de `react-icons/fa6` para género masculino/femenino.

## Text Management & Internationalization (i18n)

- **Cero Textos Quemados en Vistas Nuevas**: Toda nueva vista, modal, drawer o componente de interfaz DEBE utilizar el sistema de internacionalización a través de `useTranslation()` de `react-i18next`. Queda prohibido hardcodear textos o cadenas en español directamente en el JSX para código nuevo.
- **Estructura Modular por Namespaces**:
  - Los recursos se organizan en `src/locales/es/<namespace>.json`.
  - `common.json`: Acciones transversales (`actions.save`, `actions.cancel`, `actions.delete`, etc.), estados globales (`states.loading`, `states.saving`, etc.) y diálogos comunes.
  - Para módulos específicos, crear o extender namespaces temáticos (ej. `auth.json`, `kidChurch.json`, `admin.json`).
  - Todo nuevo namespace DEBE registrarse en `src/libs/i18n/index.ts` dentro de `resources` para preservar el tipado estricto y autocompletado en TypeScript (`CustomTypeOptions`).
- **Articulación con el Motor de Nomenclatura Adaptable**:
  - Los términos institucionales y operativos variables de la iglesia (`useChurchTerm`, `useKidsTerm`, `useMinistryTerm`) NO son textos estáticos traducibles directamente; son variables dinámicas configurables por cada iglesia.
  - La integración DEBE realizarse mediante interpolación en las plantillas de traducción:
    `t('select_meeting_prompt', { meeting: meetingTerm.toLowerCase() })` con `{ "select_meeting_prompt": "Selecciona una {{meeting}} para registrar asistencia" }`.
- **Migración Progresiva**: Los componentes existentes en mantenimiento deben migrar sus textos quemados de manera oportunista cada vez que se toquen por una tarea o mejora.

## Build And Test

- Use `npm run build` when a change affects routing, runtime behavior, or static generation.
- Ensure strict TypeScript typing (`tsc`) passes without errors.

## AI Working Rules

- Prefer local, minimal edits over broad refactors.
- Match the surrounding file style instead of reformatting unrelated code.
- When adding new behavior, check whether an existing utility, component, or slice already covers it.
- If a change depends on a repository convention, encode that convention in a file-specific instruction rather than repeating it in chat.
- **NEVER modify API/Service contract parameters**: NEVER rename, remove, add, or alter query parameters, path params, or request payload fields in API calls, services, or thunks (e.g. `registrationChurchMeetingId`) unless the user explicitly requests it. Backend contracts must remain strictly untouched.

- Agents should generate or update JSDoc comments for functions when adding or modifying code. Follow the repository's JSDoc format (one-line summary, `@param` tags with types and descriptions, `@returns` with resolved type and description). See `src/libs/utils/http/index.ts` for an example.

## Entity State & Soft-Delete Rules

- **Uso obligatorio de `state` en modelos de entidad**: Toda entidad en `src/libs/models` debe incorporar el campo `state`.
- **Extensión de `EntityState`**: `EntityState` define los estados inmutables (`ACTIVE`, `INACTIVE`, `DELETED`). Los enums específicos de entidad deben extender de este objeto mediante propagación (`...EntityState`) para evitar duplicar valores base.
- **Eliminación y prohibición de `active: boolean`**: La propiedad booleana `active` ha sido completamente purgada y eliminada de los modelos, slices, thunks y componentes. Queda estrictamente PROHIBIDO reintroducir campos `active: boolean`. Toda verificación de visibilidad o activación debe comprobar `state === EntityState.ACTIVE` (o el enum específico de la entidad).
- **Soft-Delete**: Las eliminaciones lógicas deben reflejarse mediante `state: EntityState.DELETED`.

## SemVer Versioning & Changelog Tracking (OBLIGACIÓN AUTOMÁTICA DE LA IA)

- **Agrupación estricta por jornada/día de trabajo**: PROHIBIDO crear o incrementar versiones por cada prompt, ajuste menor, commit o respuesta interactiva individual. Todos los cambios realizados en el mismo día o sesión de trabajo DEBEN agruparse bajo **una única versión del día** (agrupando todos los avances en un solo bloque consolidado).
- **Criterio de clasificación autónomo de la IA**:
  - **Parche (Patch)** (ej: `3.0.0` → `3.0.1`): Corrección de errores, ajustes de interfaz, mejoras visuales menores, formato de campos o fallos de rapidez.
  - **Menor (Minor)** (ej: `3.0.0` → `3.1.0`): Nuevas pantallas, componentes visuales nuevos (modales, drawers), nuevas herramientas o flujos funcionales compatibles.
  - **Mayor (Major)** (ej: `3.0.0` → `4.0.0`): Rediseño visual global de la aplicación, cambios incompatibles o reescritura de módulos principales.
- **Lenguaje no técnico obligatorio (No exponer detalles internos de desarrollo)**: Las descripciones y viñetas DEBEN redactarse en español simple, conciso y comprensible para cualquier usuario final (padres de familia, voluntarios). PROHIBIDO usar tecnicismos ("refactor", "endpoint", "slice", "thunk", "props", "payload", "hook", etc.) y PROHIBIDO exponer mecánicas internas de desarrollo o de base de datos ("roles de cuenta base", "roles operativos", "superadministrador", "sincronización de llamadas"). Describir únicamente el beneficio práctico visible o mejoras generales (ej. "Mejoras de estabilidad y acceso", "Correcciones y optimizaciones varias").
  - *Correcto*: "Mayor rapidez y fluidez al ingresar a la aplicación." / "Correcciones y mejoras visuales en la navegación."
  - *Incorrecto*: "Se excluyó la cuenta base de usuario del selector para que servidores solo vean roles operativos."
- **Ejecución automática por la IA**:
  - Al completar los cambios de código y preparar el commit, la IA ejecuta:
    `node scripts/bump-version.mjs --type=<patch|minor|major> --title="Título sencillo" --change="Punto 1 claro" --change="Punto 2 claro"`
  - Esto mantiene sincronizados `package.json`, `src/data/changelog.json` y la constante `APP_VERSION`.
