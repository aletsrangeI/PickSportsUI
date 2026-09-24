# 08 Testing - PickSports.UI

## Estrategia de Pruebas Frontend
- **Pruebas de Componentes y Hooks:** Vitest + React Testing Library.
- **Enfoque de Calidad:**
  - Verificar que los botones de pronóstico emitan la acción correcta (`HOME`, `AWAY`, `DRAW`).
  - Probar que el bloqueo visual de partidos pasados se aplique cuando `kickoffTime <= now`.
  - Comprobar que el `QuinielaSelector` actualice el store global y dispare la recarga de datos.
  - Asegurar que no se rompan las vistas al recibir respuestas vacías o en estado de carga (`Loading Skeleton`).
