export interface WeekOption {
  id: number;
  weekNumber: number;
  name?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Selecciona la jornada más relevante para vistas de pronósticos y calendario (Picks, Fixtures):
 * 1. La jornada ABIERTA (PUBLISHED) más reciente (mayor weekNumber).
 * 2. Si no hay abierta, la jornada EN JUEGO (LOCKED) más reciente (mayor weekNumber).
 * 3. Si no hay abierta ni en juego:
 *    - La siguiente jornada por disputarse (primera DRAFT posterior a la última SCORED).
 *    - O si el torneo concluyó, la última jornada jugada (SCORED de mayor weekNumber).
 * 4. Fallback final: la primera jornada disponible.
 */
export function getMostRelevantWeekForPicks<T extends WeekOption>(weeks: T[]): T | null {
  if (!weeks || weeks.length === 0) return null;

  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);

  // 1. Jornada abierta (PUBLISHED) más reciente
  const publishedWeeks = sorted.filter((w) => w.status?.toUpperCase() === 'PUBLISHED');
  if (publishedWeeks.length > 0) {
    return publishedWeeks[publishedWeeks.length - 1];
  }

  // 2. Jornada en juego (LOCKED) más reciente
  const lockedWeeks = sorted.filter((w) => w.status?.toUpperCase() === 'LOCKED');
  if (lockedWeeks.length > 0) {
    return lockedWeeks[lockedWeeks.length - 1];
  }

  // 3. Si hay jornadas SCORED pero no PUBLISHED/LOCKED:
  const scoredWeeks = sorted.filter((w) => w.status?.toUpperCase() === 'SCORED');
  if (scoredWeeks.length > 0) {
    const lastScored = scoredWeeks[scoredWeeks.length - 1];
    // Siguiente jornada pendiente por jugarse
    const nextDraft = sorted.find(
      (w) => w.weekNumber > lastScored.weekNumber && w.status?.toUpperCase() === 'DRAFT'
    );
    if (nextDraft) {
      return nextDraft;
    }
    // Si ya no hay jornadas pendientes, la última jugada
    return lastScored;
  }

  // 4. Si todas son DRAFT (inicio de temporada), tomar la primera
  const firstDraft = sorted.find((w) => w.status?.toUpperCase() === 'DRAFT');
  return firstDraft ?? sorted[0];
}

/**
 * Selecciona la jornada para vistas de tabla de posiciones (Standings):
 * Prioriza la jornada activa (PUBLISHED o LOCKED más reciente) o la última calificada (SCORED más reciente).
 */
export function getMostRelevantWeekForStandings<T extends WeekOption>(weeks: T[]): T | null {
  if (!weeks || weeks.length === 0) return null;

  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);

  const activeWeeks = sorted.filter((w) => {
    const s = w.status?.toUpperCase();
    return s === 'PUBLISHED' || s === 'LOCKED';
  });
  if (activeWeeks.length > 0) {
    return activeWeeks[activeWeeks.length - 1];
  }

  const scoredWeeks = sorted.filter((w) => w.status?.toUpperCase() === 'SCORED');
  if (scoredWeeks.length > 0) {
    return scoredWeeks[scoredWeeks.length - 1];
  }

  return sorted[sorted.length - 1] ?? sorted[0];
}

/**
 * Selecciona la jornada para vistas de galardones (Awards):
 * Prioriza la jornada calificada más reciente (SCORED con mayor weekNumber).
 */
export function getMostRelevantWeekForAwards<T extends WeekOption>(weeks: T[]): T | null {
  if (!weeks || weeks.length === 0) return null;

  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const scoredWeeks = sorted.filter((w) => w.status?.toUpperCase() === 'SCORED');
  if (scoredWeeks.length > 0) {
    return scoredWeeks[scoredWeeks.length - 1];
  }

  return getMostRelevantWeekForPicks(weeks);
}

/**
 * Selecciona la jornada para reportes y mensajes de WhatsApp:
 * - Para 'reminder': jornada abierta más reciente (PUBLISHED).
 * - Para 'summary': jornada calificada más reciente (SCORED).
 * - Por defecto: la jornada más relevante para picks.
 */
export function getMostRelevantWeekForWhatsApp<T extends WeekOption>(
  weeks: T[],
  reportType?: 'reminder' | 'summary' | 'player'
): T | null {
  if (!weeks || weeks.length === 0) return null;

  if (reportType === 'summary') {
    return getMostRelevantWeekForAwards(weeks);
  }

  return getMostRelevantWeekForPicks(weeks);
}
