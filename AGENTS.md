# Guía para Agentes de IA - PickSports.UI (Frontend PWA)

## Objetivo
Definir los lineamientos arquitectónicos, patrones y estándares técnicos obligatorios para el frontend de PickSports.

---

## 1. Stack Tecnológico
* **Framework Principal:** React 19 (TypeScript + Vite).
* **Manejador de Rutas:** React Router DOM (v7).
* **Manejo de Estado y API:** Redux Toolkit y RTK Query.
* **Estilos:** Vanilla CSS con metodología BEM y tokens de diseño (`src/styles/tokens.css`) con tema Stadium Dark / Light.
* **Tablas de Datos:** TanStack Table (`@tanstack/react-table`).
* **Iconografía:** `lucide-react` exclusivamente. Prohibido el uso de emojis sueltos en botones, encabezados, tablas y toasts.
* **PWA & Mobile:** Service Worker (`public/sw.js`) con Web Push API, `manifest.json` para modo `standalone` y soporte de `safe-area-inset` en iOS.

---

## 2. Lineamientos de Desarrollo Obligatorios

### 📌 Separation of Concerns (Custom Hooks)
- La lógica compleja (llamadas RTK Query, filtrado de partidos, lógica de votación de picks, mutaciones y estado local) DEBE extraerse en un Custom Hook (ej. `useJornada.ts`, `usePicks.ts`, `useStandings.ts`).
- El componente de página (`index.tsx`) es **"Render-Only"**: solo recibe datos del hook y los mapea visualmente.

### 📌 Estilos y Presentación (BEM & Tokens)
- **ESTÁ ESTRICTAMENTE PROHIBIDO el uso de Tailwind CSS.**
- Usa CSS Vanilla con metodología BEM (`.match-card__picker`, `.standings-table__row`).
- Usa variables de diseño centralizadas (`var(--color-primary)`, `var(--bg-card)`, `var(--radius-md)`).

### 📌 Modales y Diálogos
- Usa la etiqueta nativa de HTML5 `<dialog>` instanciada con una `useRef<HTMLDialogElement>` y los métodos `.showModal()` y `.close()`.

### 📌 Navegación Móvil (Bottom Navigation Bar)
- La navegación en pantallas móviles debe ser accesible desde la barra inferior fija:
  1. Jornada / Picks
  2. Posiciones (Standings)
  3. Galardones
  4. WhatsApp / Exportar
  5. Admin / Ajustes
- El selector de Quinielas reside en el Header superior para alternar en caliente entre torneos.
