# Plan de Migración: Next.js a Vite (Mobile First)

Este documento detalla el paso a paso para migrar `faith-forge-web` de Next.js + daisyUI a Vite + Radix UI + Tailwind CSS, enfocándonos en una experiencia PWA verdaderamente "nativa" (Mobile First). 

## 1. Limpieza Inicial (Cleanup)
El primer paso será limpiar las dependencias y archivos específicos de Next.js.
- **Eliminar dependencias**: `next`, `next-pwa`, `daisyui`, `react-vant`, `eslint-config-next`.
- **Eliminar directorios y archivos**: `.next/`, `next.config.js`, `next-env.d.ts`, `postcss.config.js` (si no es necesario para TW4).
- **Limpieza de `src/`**: Vaciar/eliminar temporalmente componentes y páginas que dependan directamente del enrutamiento de Next o de daisyUI/react-vant, preservando únicamente la lógica de estado y servicios (`store/`, `services/`, `utils/`).

## 2. Configuración Base de Vite
- **Inicializar Vite**: Configurar los archivos base para Vite con React y TypeScript (`vite.config.ts`, `index.html` en la raíz).
- **Configurar Alias**: Asegurar que `@/*` apunte a `src/*` en `vite.config.ts` y `tsconfig.json`.

## 3. Instalación del Nuevo Stack
- **Core UI**: `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge` (para utilidades de clases).
- **Radix UI & Gestos**: Instalar los primitivos de Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, etc.), `vaul` (bottom sheets) y `framer-motion` (animaciones).
- **Enrutamiento**: `react-router-dom`.
- **PWA**: `vite-plugin-pwa` (para el Service Worker y el manifiesto).

## 4. Configuración de Tailwind y Estilos Globales
- Implementar la configuración de Tailwind CSS v4.
- Crear el archivo base de CSS (`src/index.css` o `src/globals.css`) definiendo las variables de color, fuentes y el reset necesario para mobile (evitar el bounce en scroll indeseado, selección de texto nativa, etc.).

## 5. Diseño del Sistema de Componentes Base (UI)
Antes de portar vistas, debemos construir los bloques fundamentales en `src/components/ui/` (al estilo shadcn/ui pero adaptado a nuestras necesidades mobile):
- `Button.tsx`: Botón con variantes usando Tailwind.
- `Sheet.tsx`: Implementación de Bottom Sheet usando `vaul`.
- `Dialog.tsx`: Modales usando `@radix-ui/react-dialog`.
- `Tabs.tsx`: Navegación o pestañas usando `@radix-ui/react-tabs`.
- `Input.tsx`, `Cell.tsx` (estilo listas de iOS/Android).

## 6. Integración del Estado Global (Redux Persist)
- Restaurar `src/libs/store/` y `src/services/`.
- Configurar el `main.tsx` (punto de entrada de Vite) envolviendo la aplicación con `<Provider>` de Redux y el `<PersistGate>` para mantener la persistencia offline de los datos.

## 7. Enrutamiento (React Router DOM)
- Crear `src/router.tsx`.
- Definir las rutas base de la aplicación.
- Implementar un Layout principal (`MainLayout`) que incluya, por ejemplo, la barra de navegación inferior (Bottom Navigation Bar) fija, manejando los "safe areas" de los dispositivos móviles.

## 8. Migración de Vistas y Lógica
- Portar gradualmente los archivos de `src/pages` (Next) hacia `src/views` o `src/pages` (React Router).
- Reemplazar `<Link href>` de Next por `<Link to>` de React Router.
- Adaptar cada vista para utilizar los nuevos componentes de `src/components/ui/` en lugar de `react-vant` o `daisyUI`.

## 9. Configuración de la PWA
- Configurar `vite-plugin-pwa` en `vite.config.ts`.
- Trasladar los iconos y configuración del `manifest.json`.
- Configurar las políticas de caché del Service Worker para garantizar que la app funcione offline de manera robusta.

## 10. Pruebas y Ajustes Finales
- Verificar las interacciones táctiles (swipe-to-dismiss con Vaul, animaciones con Framer Motion).
- Probar la persistencia de sesión/datos tras recargar o simular modo offline.
- Auditoría final de TypeScript y Linting.
