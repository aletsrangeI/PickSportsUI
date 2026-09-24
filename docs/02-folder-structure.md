# 02 Folder Structure - PickSports.UI

```text
PickSportsUI/
├── public/                 # Favicons, manifest.json, sw.js, logos de deportes
├── src/
│   ├── app/
│   │   ├── hooks.ts        # Hooks tipados useAppDispatch y useAppSelector
│   │   ├── routes/         # Definición de rutas y Guards de autenticación
│   │   └── store.ts        # Store de Redux Toolkit y middlewares de RTK Query
│   ├── components/         # Componentes UI transversales
│   │   ├── Button/         # Botones con variantes de tokens y estados de carga
│   │   ├── Input/          # Inputs de texto, password y selector de deportes
│   │   ├── Modal/          # Modales accesibles para unirse / crear quinielas
│   │   ├── MatchCard/      # Tarjeta interactiva de partido con botones L / E / V
│   │   ├── BottomNav/      # Barra de navegación móvil fija inferior
│   │   └── QuinielaSelector/ # Dropdown en el header para alternar quinielas activas
│   ├── layout/
│   │   ├── AppLayout.tsx   # Layout principal (Header + Main Scroll + BottomNav)
│   │   ├── Header.tsx      # Cabecera con selector de quiniela y perfil
│   │   └── layout.css      # Estilos de layout con safe-area insets
│   ├── pages/              # Páginas por vertical
│   │   ├── auth/           # Login, Register, Forgot Password
│   │   ├── picks/          # Vista principal de pronósticos de la jornada activa
│   │   ├── standings/      # Tabla de posiciones general y desglosada
│   │   ├── awards/         # Galardones semanales (MVP, Rey de Sorpresas, etc.)
│   │   ├── quinielas/      # Vista de gestión, unirse con código y crear quiniela
│   │   └── admin/          # Panel administrativo de sincronización ESPN y auditoría
│   ├── services/           # Slices de RTK Query (authApi, quinielasApi, matchesApi, picksApi)
│   ├── styles/             # Variables CSS globales, tokens.css, resets
│   │   ├── tokens.css      # Sistema de diseño Stadium Dark / Field Light
│   │   └── global.css      # Resets de box-sizing, fuentes y safe-areas
│   ├── utils/              # Funciones auxiliares (fechas locales, desempates, clipboard)
│   ├── App.tsx             # Componente raíz con Providers
│   └── main.tsx            # Punto de entrada de Vite
├── Dockerfile              # Construcción multi-stage Nginx Alpine
├── nginx.conf              # Servidor Nginx con proxy reverso y SPA fallback
└── package.json            # Dependencias de npm
```
