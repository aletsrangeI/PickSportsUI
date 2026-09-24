# 07 State Management - PickSports.UI

## Arquitectura de Estado con Redux Toolkit
El estado global de la aplicación se divide en dos áreas principales:

1. **Estado del Cliente (Client State):**
   - `authSlice`: Usuario autenticado actual, token JWT, expiración, rol de administrador de plataforma.
   - `quinielaSlice`: Quiniela actualmente seleccionada en el Header (`activeQuinielaId`, `activeQuinielaName`, `inviteCode`, `roleInQuiniela`).
   - `uiSlice`: Notificaciones tipo toast, modales abiertos (`isJoinModalOpen`, `isCreateModalOpen`).

2. **Estado del Servidor (Server State / RTK Query):**
   - Gestionado de forma declarativa con `api.ts`.
   - Caché con invalidación por tags: al enviar pronósticos o cambiar de quiniela, las vistas de jornada y tabla de posiciones se refrescan automáticamente sin recarga manual.

## Persistencia
- El `token` JWT y el `activeQuinielaId` se sincronizan en `localStorage` para restaurar la sesión del usuario al reabrir la PWA.
