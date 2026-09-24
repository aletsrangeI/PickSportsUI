# 06 Design System & Tokens - PickSports.UI

## Tokens Semánticos (Stadium Dark)

El archivo `src/styles/tokens.css` expone las variables base del sistema visual deportivo:

```css
:root {
  /* Fondos y Superficies */
  --bg-stadium: #0B1118;
  --bg-card: #151F2C;
  --bg-card-hover: #1B293A;
  --bg-input: #0F1622;
  --border-color: #243447;
  --border-highlight: #3B82F6;

  /* Tipografía y Textos */
  --text-primary: #FFFFFF;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  /* Acentos Deportivos */
  --accent-primary: #10B981;      /* Verde Césped / Acierto */
  --accent-primary-glow: rgba(16, 185, 129, 0.25);
  --accent-warning: #F59E0B;      /* Ámbar / Pendiente / Advertencia */
  --accent-danger: #EF4444;       /* Rojo / Fallo / Bloqueado */
  --accent-draw: #6366F1;         /* Índigo / Empate */
  --accent-surprise: #EC4899;     /* Rosa Eléctrico / Galardón Upset */

  /* Espaciado y Radios */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Safe Area Insets (PWA en iOS/Android) */
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);
}
```

## Reglas de Jerarquía Visual
- Los botones de selección de pick (`Local`, `Empate`, `Visita`) deben iluminarse con su respectivo acento al ser seleccionados y mostrar sombra de resplandor (`box-shadow: 0 0 12px var(--accent-primary-glow)`).
- En caso de partido bloqueado o terminado, los botones cambian a estilo apagado o deshabilitado con candado (`Lock` de Lucide).
