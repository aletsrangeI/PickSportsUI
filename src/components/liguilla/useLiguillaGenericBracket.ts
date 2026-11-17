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

const NHL_FORMAT = 'NHL_BEST_OF_7';
const NFL_FORMAT = 'NFL_RESEEDED_SINGLE_GAME';
const ALL_GROUP = 'ALL';

/** Grupo de una ronda (conferencia o llave) con su cupo de ganadores. */
export interface BracketGroup {
  key: string;
  label: string;
  quota: number;
  teams: LiguillaTeam[];
  selectedIds: number[];
  /** Cruces del grupo (solo en la primera ronda). */
  nodes: LiguillaNode[];
}

interface GroupDef {
  key: string;
  label: string;
  quota: number;
}

const conferenceLabel = (raw: string): string => {
  const value = raw.trim();
  if (/^(east|este)/i.test(value)) return 'Este';
  if (/^(west|oeste)/i.test(value)) return 'Oeste';
  return value.toUpperCase();
};

/**
 * Hook del bracket genérico (NHL / NFL / Champions): estado de picks por ronda,
 * equipos elegibles, cupos por conferencia/llave, validación de completitud y envío.
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

  const isNhl = overview?.formatCode === NHL_FORMAT;
  const hasGroupRules = isNhl || overview?.formatCode === NFL_FORMAT;
  const lastIndex = rounds.length - 1;
  const firstCode = rounds[0]?.code;
  const firstRoundNodes = nodes.filter((n) => n.round === firstCode);

  const nodeConference = (n: LiguillaNode): string => {
    if (n.conference) return conferenceLabel(n.conference);
    if (isNhl) return n.nodeNumber <= firstRoundNodes.length / 2 ? 'Este' : 'Oeste';
    return '';
  };

  // Nodo de R1 (NHL) y conferencia de cada equipo, según donde aparece.
  const r1NodeOf: Record<number, number> = {};
  const conferenceOf: Record<number, string> = {};
  if (hasGroupRules) {
    for (const n of nodes) {
      if (isNhl && n.round !== firstCode) continue;
      for (const t of [n.teamA, n.teamB]) {
        if (!t) continue;
        r1NodeOf[t.teamId] = n.nodeNumber;
        conferenceOf[t.teamId] = nodeConference(n);
      }
    }
  }

  const groupKeyOf = (roundIndex: number, teamId: number): string => {
    if (!hasGroupRules) return ALL_GROUP;
    if (isNhl) {
      if (roundIndex === 0) return conferenceOf[teamId] ?? '';
      return String(Math.ceil((r1NodeOf[teamId] ?? 0) / 2 ** roundIndex));
    }
    return roundIndex === lastIndex && roundIndex > 0 ? ALL_GROUP : (conferenceOf[teamId] ?? '');
  };

  const groupDefs = (roundIndex: number): GroupDef[] => {
    const round = rounds[roundIndex];
    if (!hasGroupRules) return [{ key: ALL_GROUP, label: '', quota: round.winnersToPick }];

    const conferences: GroupDef[] = [];
    for (const n of firstRoundNodes) {
      const c = nodeConference(n);
      const found = conferences.find((d) => d.key === c);
      if (found) found.quota += 1;
      else conferences.push({ key: c, label: c, quota: 1 });
    }
    if (roundIndex === 0) return conferences;

    if (isNhl) {
      const count = Math.max(1, Math.floor(firstRoundNodes.length / 2 ** roundIndex));
      const half = count / 2;
      return Array.from({ length: count }, (_, k) => {
        const g = k + 1;
        let label = '';
        if (count === 2) label = g === 1 ? 'Este' : 'Oeste';
        else if (count > 2) label = `${g <= half ? 'Este' : 'Oeste'} · Llave ${((g - 1) % half) + 1}`;
        return { key: String(g), label, quota: Math.max(1, Math.round(round.winnersToPick / count)) };
      });
    }

    if (roundIndex === lastIndex || conferences.length === 0) {
      return [{ key: ALL_GROUP, label: '', quota: round.winnersToPick }];
    }
    return conferences.map((c) => ({
      key: c.key,
      label: c.label,
      quota: Math.max(1, Math.round(round.winnersToPick / conferences.length)),
    }));
  };

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
    } else if (hasGroupRules) {
      // Cupo por conferencia/llave: al exceder el cupo se desplaza al pick más antiguo del grupo.
      const key = groupKeyOf(roundIndex, teamId);
      const quota = groupDefs(roundIndex).find((d) => d.key === key)?.quota ?? 0;
      if (quota === 0) return;
      const inGroup = current.filter((id) => groupKeyOf(roundIndex, id) === key);
      const oldest = inGroup.length >= quota ? inGroup[0] : undefined;
      next = [...current.filter((id) => id !== oldest), teamId];
    } else if (current.length >= round.winnersToPick) {
      return;
    } else {
      next = [...current, teamId];
    }

    setLocalPicks(prune({ ...picksByRound, [roundCode]: next }));
  };

  const groupsByRound: Record<string, BracketGroup[]> = {};
  rounds.forEach((round, index) => {
    const picks = picksByRound[round.code] ?? [];
    groupsByRound[round.code] = groupDefs(index).map((def) => ({
      ...def,
      teams: (eligibleByRound[round.code] ?? []).filter((t) => groupKeyOf(index, t.teamId) === def.key),
      selectedIds: picks.filter((id) => groupKeyOf(index, id) === def.key),
      nodes:
        index === 0
          ? firstRoundNodes.filter((n) => !hasGroupRules || nodeConference(n) === def.key)
          : [],
    }));
  });

  const isComplete =
    rounds.length > 0 &&
    rounds.every(
      (r) =>
        (picksByRound[r.code] ?? []).length === r.winnersToPick &&
        (groupsByRound[r.code] ?? []).every((g) => g.selectedIds.length === g.quota)
    );

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
    groupsByRound,
    replacesOnFull: hasGroupRules,
    isLocked,
    isComplete,
    submitting,
    errorMessage,
    selectWinner,
    submit,
  };
}

export type GenericBracketState = ReturnType<typeof useLiguillaGenericBracket>;
