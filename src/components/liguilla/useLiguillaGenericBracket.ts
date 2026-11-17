import { useState } from 'react';
import { useSubmitLiguillaPicksMutation } from '../../services/api';
import type { LiguillaNode, LiguillaOverview, LiguillaRound, LiguillaTeam } from '../../types';

type PicksByRound = Record<string, number[]>;

interface ApiErrorShape {
  data?: { message?: string };
  message?: string;
}

const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape | null;
  return e?.data?.message || e?.message || fallback;
};

const byOrder = (a: LiguillaRound, b: LiguillaRound) => a.order - b.order;

/** Equipos con descanso (TeamA sin TeamB) en los nodos de una ronda. */
const byeTeamsOf = (nodes: LiguillaNode[], roundCode: string): LiguillaTeam[] =>
  nodes
    .filter((n) => n.round === roundCode && n.teamA && !n.teamB)
    .map((n) => n.teamA as LiguillaTeam);

const uniqueById = (teams: LiguillaTeam[]): LiguillaTeam[] => {
  const seen = new Set<number>();
  return teams.filter((t) => (seen.has(t.teamId) ? false : (seen.add(t.teamId), true)));
};

/**
 * Hook del bracket genérico (NHL / NFL / Champions): estado de picks por ronda,
 * equipos elegibles, validación de completitud y envío.
 */
export function useLiguillaGenericBracket(quinielaId: number | undefined, overview: LiguillaOverview | undefined) {
  const [submitPicks, { isLoading: submitting }] = useSubmitLiguillaPicksMutation();
  const [localPicks, setLocalPicks] = useState<PicksByRound>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rounds = [...(overview?.rounds ?? [])].sort(byOrder);
  const nodes = overview?.nodes ?? [];
  const userBracket = overview?.userBracket;
  const isLocked = Boolean(userBracket);

  const teamMap: Record<number, LiguillaTeam> = {};
  for (const t of overview?.qualifiedTeams ?? []) teamMap[t.teamId] = t;
  for (const n of nodes) {
    if (n.teamA) teamMap[n.teamA.teamId] = n.teamA;
    if (n.teamB) teamMap[n.teamB.teamId] = n.teamB;
  }

  const eligibleFor = (roundIndex: number, picks: PicksByRound): LiguillaTeam[] => {
    const round = rounds[roundIndex];
    if (!round) return [];
    if (roundIndex === 0) {
      return uniqueById(
        nodes
          .filter((n) => n.round === round.code)
          .flatMap((n) => [n.teamA, n.teamB])
          .filter((t): t is LiguillaTeam => Boolean(t))
      );
    }
    const previous = (picks[rounds[roundIndex - 1].code] ?? [])
      .map((id) => teamMap[id])
      .filter((t): t is LiguillaTeam => Boolean(t));
    return uniqueById([...previous, ...byeTeamsOf(nodes, round.code)]);
  };

  /** Quita de cada ronda los picks que dejaron de ser elegibles (limpia dependientes). */
  const prune = (picks: PicksByRound): PicksByRound => {
    const result: PicksByRound = {};
    rounds.forEach((round, index) => {
      const allowed = new Set(eligibleFor(index, result).map((t) => t.teamId));
      result[round.code] = (picks[round.code] ?? []).filter((id) => allowed.has(id));
    });
    return result;
  };

  const picksByRound: PicksByRound = isLocked ? (userBracket?.picksByRound ?? {}) : prune(localPicks);

  const eligibleByRound: Record<string, LiguillaTeam[]> = {};
  rounds.forEach((round, index) => {
    eligibleByRound[round.code] = eligibleFor(index, picksByRound);
  });

  const selectWinner = (roundCode: string, teamId: number) => {
    if (isLocked) return;
    const roundIndex = rounds.findIndex((r) => r.code === roundCode);
    if (roundIndex < 0) return;
    const round = rounds[roundIndex];
    const current = picksByRound[roundCode] ?? [];

    let next: number[];
    if (current.includes(teamId)) {
      next = current.filter((id) => id !== teamId);
    } else if (roundIndex === 0) {
      // Primera ronda: un ganador por cruce; elegir uno desplaza al rival del mismo nodo.
      const rivalIds = nodes
        .filter((n) => n.round === roundCode && (n.teamA?.teamId === teamId || n.teamB?.teamId === teamId))
        .flatMap((n) => [n.teamA?.teamId, n.teamB?.teamId]);
      next = [...current.filter((id) => !rivalIds.includes(id)), teamId];
    } else if (current.length >= round.winnersToPick) {
      return;
    } else {
      next = [...current, teamId];
    }

    setLocalPicks(prune({ ...picksByRound, [roundCode]: next }));
  };

  const isComplete =
    rounds.length > 0 && rounds.every((r) => (picksByRound[r.code] ?? []).length === r.winnersToPick);

  const submit = async (): Promise<boolean> => {
    if (isLocked || !isComplete || !quinielaId) return false;
    setErrorMessage(null);
    try {
      const result = await submitPicks({ quinielaId, data: { picksByRound } }).unwrap();
      if (!result.isSuccess) {
        setErrorMessage(result.message || 'Error al confirmar el pronóstico');
        return false;
      }
      return true;
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, 'Error al registrar el pronóstico.'));
      return false;
    }
  };

  return {
    rounds,
    teamMap,
    picksByRound,
    eligibleByRound,
    isLocked,
    isComplete,
    submitting,
    errorMessage,
    selectWinner,
    submit,
  };
}

export type GenericBracketState = ReturnType<typeof useLiguillaGenericBracket>;
