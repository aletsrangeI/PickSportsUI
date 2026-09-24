# 00 Project Overview - PickSports.UI

## Objetivo del Proyecto
PickSports.UI es la aplicación frontend para la plataforma de quinielas deportivas multideporte y multiquiniela. Diseñada como una Progressive Web App (PWA) Mobile-First para iOS y Android, permitiendo a los usuarios registrarse, unirse a quinielas mediante códigos de invitación, emitir pronósticos con interfaz táctil fluida, ver marcadores en vivo, consultar tablas de posiciones y desempates, recibir notificaciones Web Push y compartir resúmenes de jornadas.

## Tecnologías Principales
- **Framework:** React 18 / 19 + TypeScript
- **Herramienta de Construcción:** Vite
- **Estilos:** Vanilla CSS con metodología BEM y tokens semánticos (Stadium Dark / Field Light). **PROHIBIDO** el uso de Tailwind CSS.
- **Iconografía:** `lucide-react` exclusivamente. **PROHIBIDO** el uso de emojis planos en botones o tablas.
- **Manejo de Estado:** Redux Toolkit & RTK Query
- **Enrutamiento:** React Router DOM v6 / v7
- **PWA:** Service Worker para Web Push y modo standalone en iOS/Android
- **Servidor de Producción:** Nginx en Alpine Linux

## Principios de Diseño
- **Mobile-First Real:** Diseñado principalmente para pantallas móviles (viewport 360px - 430px) con navegación inferior fija (`BottomNav`) y safe-area insets para iPhone con Dynamic Island / Home Indicator.
- **Dark Mode Deportivo:** Tema "Stadium Dark" como paleta predeterminada inspirada en reflectores de estadio, césped iluminado y acentos eléctricos.
- **Zero Friction:** Acceso directo a quinielas activas desde el selector en la cabecera sin recargas de página.
