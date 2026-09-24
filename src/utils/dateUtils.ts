/**
 * Convierte de manera segura un string ISO a un objeto Date interpretado como UTC.
 * Si el backend envía "2026-09-26T01:00:00" sin sufijo 'Z', se le agrega 'Z'
 * para que el navegador del usuario lo convierta correctamente a la hora local
 * (ejemplo: Viernes 19:00 hrs en Ciudad de México / UTC-6).
 */
export function parseUtcDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Si ya contiene indicador de zona horaria ('Z' o desfasamiento +HH:MM / -HH:MM)
  const hasTimezone = trimmed.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(trimmed);
  const parsed = new Date(hasTimezone ? trimmed : `${trimmed}Z`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formatea la fecha en formato corto para México: ej. "vie, 25 de sep"
 */
export function formatMatchDate(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Formatea la hora en formato 24 hrs o 12 hrs para México: ej. "19:00"
 */
export function formatMatchTime(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  if (!d) return '';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formatea la fecha y hora límite de forma legible: ej. "vie, 26 de sep • 19:00 hrs"
 */
export function formatDeadline(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  if (!d) return 'Antes del silbatazo inicial';
  const dateFormatted = d.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeFormatted = d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateFormatted} • ${timeFormatted} hrs`;
}

