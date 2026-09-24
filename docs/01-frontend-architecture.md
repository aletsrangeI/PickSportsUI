# Arquitectura de Frontend - PickSportsUI

## 1. Estructura de Directorios
```
src/
├── app/
│   ├── hooks.ts            # Hooks de Redux tipados (useAppDispatch, useAppSelector)
│   ├── routes/             # AppRouter, PrivateRoute, guards
│   └── store.ts            # Redux Store centralizado con RTK Query reducers
├── components/             # Componentes UI reutilizables (Button, Input, MatchCard, Modal, BottomNav)
├── config/                 # Configuraciones estáticas y constantes de navegación
├── layout/                 # Layout principal responsivo (AppLayout con Header y BottomNav)
├── pages/                  # Vistas agrupadas por dominio (auth, jornada, posiciones, galardones, admin)
│   └── jornada/
│       ├── index.tsx       # Render-Only
│       ├── useJornada.ts   # Custom Hook con lógica RTK Query
│       └── jornada.css     # Estilos BEM
├── services/               # Clientes de API generados (RTK Query API slices)
└── styles/                 # tokens.css, temas Stadium Dark/Light y resets globales
```

## 2. Flujo de Datos
- Las peticiones a la API residen en `services/api.ts` utilizando RTK Query con tags de invalidación de caché (`Quinielas`, `Weeks`, `Picks`, `Standings`).
- Los estados de mutación (ej. actualizar pick) ofrecen actualización optimista en el cliente para respuesta instantánea de 0ms antes de confirmar con el servidor.
