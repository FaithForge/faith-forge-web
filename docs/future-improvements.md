# Hoja de Ruta: Mejoras de Soporte, Calidad y Mantenibilidad

Este documento consolida los diagnósticos técnicos y planes de acción para robustecer la aplicación **Iglekids** en producción, facilitando el soporte operativo, la estabilidad y la observabilidad.

---

## 1. Reparación de ESLint y Script de CI (`npm run lint`)

### Diagnóstico
- `npm run lint` falla actualmente con error de salida `2`.
- El comando en `package.json` incluye `--ext ts,tsx`, parámetro en desuso tras la adopción de ESLint Flat Config.
- Los archivos `.eslintrc.js` y `eslint.config.mjs` intentan extender `next/core-web-vitals` y `next/typescript`, dependencias eliminadas al migrar de Next.js a Vite.

### Plan de Implementación
1. **Unificar configuración**:
   - Eliminar `.eslintrc.js`, `.eslintrc.json` y `.eslintignore` obsoletos de la raíz.
   - Configurar `eslint.config.mjs` de forma limpia para Vite, React 18, TypeScript y Tailwind:
     ```js
     import js from '@eslint/js';
     import tseslint from 'typescript-eslint';
     import reactPlugin from 'eslint-plugin-react';
     import reactHooks from 'eslint-plugin-react-hooks';

     export default tseslint.config(
       { ignores: ['dist', 'node_modules', 'public'] },
       js.configs.recommended,
       ...tseslint.configs.recommended,
       {
         plugins: {
           react: reactPlugin,
           'react-hooks': reactHooks,
         },
         rules: {
           ...reactHooks.configs.recommended.rules,
           'react/react-in-jsx-scope': 'off',
           '@typescript-eslint/no-explicit-any': 'warn',
         },
       }
     );
     ```
2. **Actualizar `package.json`**:
   - Cambiar `"lint": "eslint . --report-unused-disable-directives --max-warnings 0"`.

---

## 2. Modernización de Docker y Variables de Entorno

### Diagnóstico
- [Dockerfile](file:///home/jucarlospm/Documentos/projects/faith-forge-web/Dockerfile) aún busca `/app/.next` y `next.config.js`. Cualquier intento de despliegue mediante contenedor falla en tiempo de build.
- [docker-compose.yml](file:///home/jucarlospm/Documentos/projects/faith-forge-web/docker-compose.yml) y [.env.example](file:///home/jucarlospm/Documentos/projects/faith-forge-web/.env.example) mantienen nombres de variables con prefijo `NEXT_PUBLIC_*` en lugar del estándar de Vite `VITE_*` (`VITE_API_BASE_URL`, `VITE_CHURCH_ID`).
- [ecosystem.config.js](file:///home/jucarlospm/Documentos/projects/faith-forge-web/ecosystem.config.js) invoca `nx run kid-church:start` (vestigio de un monorepo antiguo).

### Plan de Implementación
1. **Dockerfile Multi-Stage para SPA**:
   ```dockerfile
   # Stage 1: Build
   FROM node:22-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   ARG VITE_API_BASE_URL
   ARG VITE_CHURCH_ID
   ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
   ENV VITE_CHURCH_ID=${VITE_CHURCH_ID}
   RUN npm run build

   # Stage 2: Production Server (Nginx Alpine)
   FROM nginx:1.27-alpine AS production
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 3000
   CMD ["nginx", "-g", "daemon off;"]
   ```
2. **Nginx SPA fallback**: Configurar `try_files $uri $uri/ /index.html;` para permitir el enrutamiento directo de React Router.
3. **Variables en Compose**: Reemplazar `NEXT_PUBLIC_*` por `VITE_*` en los compose y en `.env.example`.
4. **Limpieza**: Retirar `ecosystem.config.js` si ya no se utiliza PM2 con NX.

---

## 3. Observabilidad, Monitoreo y Telemetría en Tiempo Real

### Diagnóstico
- Errores en dispositivos de los usuarios en eventos o aulas de niños solo se escriben en `console.error` dentro de [ErrorBoundary.tsx](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/components/common/ErrorBoundary.tsx).
- El equipo de soporte no tiene registro proactivo de qué pantalla falló, en qué tablet/móvil, ni qué excepción ocurrió.

### Plan de Implementación
1. **Cliente de Logging / Telemetría**:
   - Integrar un SDK ligero como `@sentry/react` o un servicio HTTP propio de logging (`/api/ms-system/client-logs`).
2. **Enriquecimiento del contexto**:
   - Enviar en cada reporte:
     - Versión de la app (`__APP_BUILD_TIME__` / `version.json`).
     - Usuario autenticado y rol activo (`authSlice.currentRole`).
     - Reunión de iglesia activa (`churchMeetingSlice.current?.id`).
     - Dispositivo / User Agent y estado de conexión (`navigator.onLine`).
3. **Intercepción HTTP**:
   - Capturar errores `5xx` y caídas continuas de red en [src/libs/utils/http/index.ts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/libs/utils/http/index.ts) para alertar si un microservicio está caído.

---

## 4. Resiliencia HTTP: Timeouts y Reintentos Automáticos

### Diagnóstico
- En [src/libs/utils/http/index.ts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/libs/utils/http/index.ts), `executeApiRequest` crea una nueva instancia de Axios por petición (`axios.create({ baseURL })`) sin definir `timeout`.
- En condiciones de conectividad inestable (zonas con señal débil en la iglesia), las peticiones pueden quedar suspendidas indefinidamente, dejando pantallas en estado de carga infinito.

### Plan de Implementación
1. **Instancias Axios reutilizables**:
   - Cachear instancias por microservicio para no recrearlas continuamente.
2. **Timeout Global**:
   - Establecer `timeout: 15000` (15 segundos) por defecto.
3. **Reintentos Idempotentes (GET)**:
   - Implementar un interceptor o wrapper para reintentar (hasta 2 veces con backoff exponencial) únicamente llamadas de tipo `GET` ante errores `ECONNABORTED`, `ETIMEDOUT` o `Network Error`.
   - **Regla estricta**: Nunca reintentar automáticamente `POST`, `PUT` o `PATCH` para evitar duplicación de registros de asistencia o niños.

---

## 5. Suite de Pruebas Automatizadas (Vitest)

### Diagnóstico
- En `package.json` figuran librerías de Jest, pero no hay archivo de configuración, ni script `"test"`, ni tests unitarios (`0` archivos `*.test.ts` en el proyecto).

### Plan de Implementación
1. **Migración a Vitest**:
   - Desinstalar `jest`, `ts-jest`, `babel-jest` e instalar `vitest` y `@testing-library/react`.
   - Vitest se integra directamente con [vite.config.mts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/vite.config.mts) compartiendo plugins y alias `@/`.
2. **Cobertura de utilidades críticas**:
   - [text.ts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/libs/utils/text.ts): validación de parsing de búsqueda (`parseEntitySearchParams`), capitalización y formateos de nombres.
   - [date.ts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/libs/utils/date.ts): cálculo de edades y rangos para asignación automática de aulas de niños.
   - [escposBuilder.ts](file:///home/jucarlospm/Documentos/projects/faith-forge-web/src/libs/utils/printer/escposBuilder.ts): verificar que los buffers binarios ESC/POS generen los comandos correctos (inicialización, QR, corte de papel).
