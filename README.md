# Iglekids Web (Faith Forge Web)

Aplicativo web progresivo (PWA) para el registro, control de asistencia y gestión de aulas de niños en Rios de Vida.

## Stack Tecnológico

- **Frontend Core**: [Vite 6](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Enrutamiento**: [React Router DOM 6](https://reactrouter.com/) con code-splitting dinámico (`React.lazy` + `Suspense`)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI primitives + Vaul (bottom sheets táctiles) + Framer Motion
- **Estado Global**: [Redux Toolkit](https://redux-toolkit.js.org/) + [Redux Persist](https://github.com/rt2zz/redux-persist)
- **PWA & Offline**: [Vite Plugin PWA](https://vite-pwa-org.netlify.app/) con Service Workers y auto-actualización en caliente
- **Impresión Térmica**: Web Bluetooth Low Energy (BLE) nativo con secuencias ESC/POS y arquitectura de drivers desacoplada

## Estructura del Proyecto

```
faith-forge-web/
├── src/
│   ├── components/       # Componentes UI reusables (primitives, layout, modals, drawers)
│   ├── config/           # Configuración de rutas y constantes globales
│   ├── libs/
│   │   ├── common-types/ # Tipos HTTP, microservicios y constantes
│   │   ├── context/      # Contextos React (NetworkStatus, etc.)
│   │   ├── hooks/        # Hooks personalizados (BackSwipeGuard, modal controls)
│   │   ├── models/       # Modelos e interfaces de dominio TypeScript
│   │   ├── state/        # Store de Redux, slices persistidos y thunks
│   │   └── utils/        # Clientes HTTP, impresión BLE ESC/POS, biometría, fechas
│   ├── services/         # Servicios de dominio API
│   ├── views/            # Vistas de la aplicación (Admin, KidRegistration, KidChurch, Auth)
│   ├── App.tsx           # Enrutamiento central y orquestación de vistas
│   └── main.tsx          # Punto de entrada, ErrorBoundary y registro de PWA
└── docs/                 # Documentación y hojas de ruta de mejoras
```

## Primeros Pasos

### 1. Variables de Entorno
Copia el archivo de ejemplo para configurar tus variables locales:
```bash
cp .env.example .env
```

Variables requeridas:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CHURCH_ID=tu-church-uuid
```

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Compilación para Producción
```bash
npm run build
```
Genera los artefactos optimizados y particionados en la carpeta `dist/`.

### 5. Vista Previa de Producción
```bash
npm run start
```
Inicia un servidor local de vista previa con la versión minificada de `dist/`.

## Docker y Entornos Integrados

Para iniciar el entorno con Docker:
```bash
# Iniciar stack local integrado
npm run dev:stack

# Reiniciar base de datos y volumen del stack
npm run dev:stack:reset

# Detener el stack
npm run dev:stack:down
```

## Guía para Agentes y Desarrolladores
Consulta [AGENTS.md](./AGENTS.md) para conocer las convenciones de código, estilos y normas de desarrollo del proyecto.
