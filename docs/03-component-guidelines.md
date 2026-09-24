# 03 Component Guidelines - PickSports.UI

## Principios de Componentes
1. **Render-Only / Presentational Separation:**
   - Mantener los componentes de vista enfocados en la presentación.
   - Extraer la lógica compleja de estado y mutaciones a custom hooks (ej. `useMatchPicks.ts`, `useQuinielaSelector.ts`).
2. **Vanilla CSS + BEM:**
   - Nombrado de clases siguiendo Bloque__Elemento--Modificador:
     ```css
     .match-card { ... }
     .match-card__team { ... }
     .match-card__pick-btn--selected { ... }
     ```
   - No utilizar frameworks de utilidades CSS como Tailwind.
3. **Iconos Lucide Exclusivamente:**
   - Prohibido utilizar emojis (`⚽`, `🏆`, `❌`, `🔥`) en botones de acción o celdas de tabla.
   - Utilizar componentes de `lucide-react`:
     ```tsx
     import { Trophy, AlertCircle, Shield, CheckCircle, ChevronDown } from 'lucide-react';
     ```
4. **Accesibilidad Táctil (Mobile-First):**
   - Áreas mínimas de toque de 44x44px en botones de pronóstico (L / E / V) y selectores.
   - Soporte para gestos táctiles y feedback activo (`:active` con escala o iluminación sutil).
   - Uso de `safe-area-inset-bottom` en la barra de navegación inferior.
