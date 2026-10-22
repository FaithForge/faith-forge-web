---
name: ui-consistency
description: "Use when building or editing UI in this app: forms and inputs, icons, layouts, the TopBar/AdminLayout, bottom sheets, or mobile behavior. Enforces the shared placeholder color, icon-per-context rules, and the exact TopBar shape."
---

# UI/UX Consistency

## Stack and hierarchy

Vite + React + TypeScript + Tailwind v4 + Radix UI (primitives) + Vaul (bottom sheets) + Framer Motion. NEVER DaisyUI or React-Vant. Order of preference: existing `src/components/ui/` primitives (`Button`, `ConfirmModal`, `SettingsDrawer`, `AppDrawer`, `Select`, ...) → Tailwind utilities.

## Mobile first

Optimize for touch. Use Vaul for bottom sheets with drag gestures. Intercept `popstate` to prevent accidental back navigation. Use full-width forms.

## Placeholders

ALL form fields (`<input>`, `<textarea>`, `<select>`, `Input.tsx`, `Select.tsx`, `SelectSearch.tsx`, `PhoneInput.tsx`, `DatePickerWheel.tsx`, ...) use exactly `placeholder:text-gray-400` (`#9ca3af`). Never `gray-500` / `gray-600`.

## Icons (fixed per context)

- **WhatsApp**: `FaWhatsapp` from `react-icons/fa6`. Never Lucide `MessageCircle` / `MessageSquare`.
- **Phone calls**: `Phone` from `lucide-react`.
- **Boys / girls**: `FaChild` / `FaChildDress` from `react-icons/fa6`.

## TopBar (every layout, incl. AdminLayout, MainLayout, new modules)

Replicate the standard `TopBar` exactly. Container: `px-4 py-2 sm:py-2.5 flex justify-between items-center shrink-0`.

- **Left**: circular avatar `w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full`; title `font-extrabold text-[13px] sm:text-[15px] leading-snug tracking-tight truncate`; subtitle `text-[10px] sm:text-[11px] font-medium opacity-90 mt-0.5 leading-none`.
- **Right**: animated circular search button `w-8 h-8 rounded-full`; circular user trigger `w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full overflow-hidden`.
- **Menus**: profile and space navigation live ONLY inside the avatar `DropdownMenu.Content`, never as loose buttons or pills in the bar.
- **Do NOT invent new shapes**: no oversized bars (`h-16`), no custom pills. Modules vary only by theme color (`bg-slate-900` admin, `bg-primary` iglekids).

## Unified Form Inputs (`src/components/ui/`)

All form fields in the app MUST use the centralized components from `src/components/ui/`. NEVER write raw burned `<input>` or `<textarea>` tags with ad-hoc border/bg/padding classes.

1. **Basic input**: `<Input />` (`src/components/ui/Input.tsx`) — rounded-2xl cards with theme glow, clear action, password visibility toggle, leftIcon, error state.
2. **Textarea**: `<Textarea />` (`src/components/ui/Textarea.tsx`) — rounded-2xl cards with theme focus glow, right header hint (`rightHint`), quality indicator badge (`Redacción clara y comprensible`), character counter (`172 / 400 caracteres`).
3. **Photo upload zone**: `<PhotoUploadZone />` (`src/components/ui/PhotoUploadZone.tsx`) — dual action cards (Camera & Gallery), slot-based pre-rendered placeholders (`Foto 1`, `Foto 2`, `Foto 3`), central deletion action, lightbox preview, and theme-adaptive counters.
4. **Phone input**: `<PhoneInput />` (`src/components/ui/PhoneInput.tsx`) — country dial code picker with search drawer, mandatory indicator (`* OBLIGATORIO`), and WhatsApp notice with `<FaWhatsapp />`.
5. **Person / Kid search**: `<PersonSearchInput />` (`src/components/ui/PersonSearchInput.tsx`) — dual state: search bar with live dropdown and enriched selected person card (photo avatar, code badge `#113556`, category tag with dot indicator, reload/change button).
6. **Date wheel picker**: `<DatePickerWheel />` (`src/components/ui/DatePickerWheel.tsx`) — bottom sheet with top actions (Cancelar | Seleccionar Fecha | Confirmar), live date preview pill with calendar icon, 3 independent capsule highlight lenses (`DÍA`, `MES`, `AÑO`), and helper hint.


