# 09 Definition of Done (DoD) - PickSports.UI

Un componente, vista o flujo de frontend se considera completado (**Done**) únicamente si cumple con:

1. **Diseño y Estética:**
   - Cumple con la estética deportiva Stadium Dark y utiliza tokens semánticos definidos en `tokens.css`.
   - Utiliza exclusivamente iconos de `lucide-react`. Sin emojis en botones o tablas.
   - Utiliza Vanilla CSS con metodología BEM. Sin Tailwind CSS.
2. **Responsividad y Mobile-First:**
   - Funciona sin desbordamiento horizontal en pantallas móviles (360px a 430px).
   - Respeta los `safe-area-insets` para iOS y Android.
3. **Compilación y Build:**
   - `npm run build` compila sin errores de TypeScript ni advertencias de linting.
   - El Dockerfile compila exitosamente y Nginx sirve la aplicación con `/healthz` respondiendo 200 OK.
4. **Integración con API:**
   - Los datos fluyen mediante RTK Query con invalidación oportuna de tags.
   - Manejo adecuado de estados de carga (skeletons/spinners) y estados de error accesibles.
