# 05 API Consumption - PickSports.UI

## Cliente HTTP y RTK Query
PickSports.UI consume la API REST de `PickSportsApi` a través de RTK Query, aprovechando caché inteligente e invalidación automática mediante tags:

```typescript
// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../app/store';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Quinielas', 'Weeks', 'Matches', 'Picks', 'Standings', 'Awards'],
  endpoints: () => ({}),
});
```

## Manejo de Errores y Reconexión
- Las mutaciones capturan errores de validación de negocio (ej. `422 Partido ya iniciado`) y muestran retroalimentación visual al usuario en toasts.
- Las consultas críticas (partidos en vivo y marcadores) aplican `pollingInterval: 30000` durante los horarios de partido.
