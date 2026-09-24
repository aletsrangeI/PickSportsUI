# 99 Technical Debt - PickSports.UI

## Registro de Deuda Técnica

### 1. Limpieza de Boilerplate Antiguo
- **Estado:** El repositorio `PickSportsUI` clonado contiene dependencias heredadas de dashboard administrativo antiguo (`@mui/material`, `@fullcalendar`, `formik`).
- **Acción:** En SPEC-002, depurar el `package.json` para dejar una base limpia con React 18/19, TypeScript, Redux Toolkit, React Router DOM, `lucide-react` y Vite PWA, eliminando MUI y dependencias obsoletas no utilizadas.

### 2. Service Worker y Caché Offline de PWA
- **Estado:** Configuración inicial de PWA pendiente de `vite-plugin-pwa`.
- **Acción:** Integrar el registro del Service Worker para soporte de Web Push notifications y retención de UI en caídas momentáneas de red.
