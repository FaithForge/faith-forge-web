# Arquitectura de Interfaz y Diseño Visual (Mobile First)

Estas reglas dictan cómo se debe construir y extender la interfaz gráfica en la aplicación.

## 1. Identidad Visual por Roles (Theming)
- La aplicación debe ser capaz de cambiar su esquema de colores principal dependiendo del rol del usuario (Ej: Tutor, Voluntario, Administrador).
- Esto se logra utilizando **Variables CSS** en el `:root` o aplicando clases en el tag `<html>` / `<body>` (ej: `theme-tutor`, `theme-admin`) que Tailwind pueda interpretar.
- **Nunca** quemar colores absolutos como `bg-blue-600` para elementos principales. Utilizar colores semánticos como `bg-primary`, donde `primary` se define dinámicamente según el rol.

## 2. Reutilización Estricta (Componentes Base)
- Todo elemento gráfico que se repita (Botones, Inputs, Tarjetas, Avatares, Badges) **DEBE** encapsularse en un componente dentro de `src/components/ui/`.
- Las vistas o páginas de la aplicación solo deben ensamblar estos componentes. No se debe escribir Tailwind directamente en las vistas para definir la estructura de un botón o un input.

## 3. Distribución y Layout (Basado en la Referencia)
- **Top Bar**: Encabezado fijo o sticky con logo, rol, notificaciones y perfil.
- **Contenido Central**: Área escrolleable para el contenido principal (Tarjetas, Listas).
- **Bottom Navigation**: Barra de navegación inferior fija para acceso rápido a las secciones principales, manejando áreas seguras (Safe Areas) de dispositivos móviles.
- **Floating Action Button (FAB)**: Botones destacados (como el "Escáner") deben sobresalir visualmente en la navegación.

## 4. Tecnologías Permitidas para UI
- Estilos utilitarios: **Tailwind CSS**.
- Primitivos de UI (Lógica y Accesibilidad): **Radix UI**.
- Animaciones y Transiciones: **Framer Motion**.
- Bottom Sheets: **Vaul**.
